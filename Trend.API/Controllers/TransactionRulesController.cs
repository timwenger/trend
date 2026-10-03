using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Trend.API.Models;
using Trend.API.Services;

namespace Trend.API.Controllers
{
    [ApiController]
    [EnableCors("ProductionOrDevEnvironment")]
    [Authorize(Policy = "CanWriteToTransactions")]
    [Route("api/[controller]")]
    public class TransactionRulesController : ControllerBase
    {
        private readonly TransactionRuleService transactionRuleService;

        public TransactionRulesController(TransactionRuleService transactionRuleService)
        {
            this.transactionRuleService = transactionRuleService;
        }

        [HttpGet]
        public async Task<ActionResult> GetAll()
        {
            string? userId = GetUserId();
            if (userId == null)
                return Unauthorized();

            return Ok(await transactionRuleService.GetRulesAsync(userId));
        }

        [HttpPost("generate-pending")]
        public async Task<ActionResult> GeneratePending()
        {
            string? userId = GetUserId();
            if (userId == null)
                return Unauthorized();

            await transactionRuleService.GeneratePendingAsync(userId, DateTime.Today);
            return NoContent();
        }

        [HttpPost]
        public async Task<ActionResult> Add(TransactionRule rule)
        {
            string? userId = GetUserId();
            if (userId == null)
                return Unauthorized();
            ActionResult? validationResult = ValidateRule(rule);
            if (validationResult != null)
                return validationResult;

            rule.Id = Guid.NewGuid().ToString();
            rule.UserId = userId;
            rule.DateTimeWhenRecorded = DateTime.UtcNow;
            NormalizeDates(rule);
            rule.GenerateFromDate = rule.StartDate;
            rule.IsInactive = false;

            TransactionRule created = await transactionRuleService.CreateRuleAsync(rule);
            await transactionRuleService.GeneratePendingAsync(userId, DateTime.Today, created);
            return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(string id, TransactionRule rule)
        {
            string? userId = GetUserId();
            if (userId == null)
                return Unauthorized();
            TransactionRule? existing = await transactionRuleService.GetRuleAsync(id);
            if (existing == null)
                return NotFound();
            if (existing.UserId != userId)
                return Unauthorized();
            if (id != rule.Id)
                return BadRequest();
            ActionResult? validationResult = ValidateRule(rule);
            if (validationResult != null)
                return validationResult;

            rule.UserId = existing.UserId;
            rule.DateTimeWhenRecorded = existing.DateTimeWhenRecorded;
            rule.IsInactive = existing.IsInactive;
            NormalizeDates(rule);
            rule.GenerateFromDate = rule.StartDate;
            await transactionRuleService.ReplaceRuleAsync(rule);
            await transactionRuleService.RecalculatePendingForRuleAsync(rule, DateTime.Today);
            return NoContent();
        }

        [HttpPost("{id}/status")]
        public async Task<ActionResult> SetStatus(string id, RuleStatusRequest request)
        {
            string? userId = GetUserId();
            if (userId == null)
                return Unauthorized();
            TransactionRule? rule = await transactionRuleService.GetRuleAsync(id);
            if (rule == null)
                return NotFound();
            if (rule.UserId != userId)
                return Unauthorized();

            if (request.IsInactive)
            {
                rule.IsInactive = true;
                await transactionRuleService.DeletePendingForRuleAsync(userId, id);
            }
            else
            {
                rule.IsInactive = false;
                rule.GenerateFromDate = request.CatchUpMissed
                    ? rule.StartDate
                    : DateTime.Today;
            }

            await transactionRuleService.ReplaceRuleAsync(rule);
            if (!rule.IsInactive)
                await transactionRuleService.GeneratePendingAsync(userId, DateTime.Today, rule);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            string? userId = GetUserId();
            if (userId == null)
                return Unauthorized();
            TransactionRule? rule = await transactionRuleService.GetRuleAsync(id);
            if (rule == null)
                return NotFound();
            if (rule.UserId != userId)
                return Unauthorized();

            await transactionRuleService.DeleteRuleAsync(rule);
            return NoContent();
        }

        private string? GetUserId()
        {
            return User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
        }

        private ActionResult? ValidateRule(TransactionRule rule)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            if (rule.RecurrenceUnit != RecurrenceUnits.Days &&
                rule.RecurrenceUnit != RecurrenceUnits.Weeks &&
                rule.RecurrenceUnit != RecurrenceUnits.Months)
                return BadRequest("Recurrence unit must be days, weeks, or months.");
            if (rule.UseMonthEnd && rule.RecurrenceUnit != RecurrenceUnits.Months)
                return BadRequest("Month end can only be used with monthly rules.");
            if (rule.EndDate.HasValue && rule.EndDate.Value.Date < rule.StartDate.Date)
                return BadRequest("End date cannot be before the start date.");
            string? categoryError = Category.GetSelectionError(rule.Categories);
            if (categoryError != null)
                return BadRequest(categoryError);
            return null;
        }

        private static void NormalizeDates(TransactionRule rule)
        {
            rule.StartDate = AsDateOnly(rule.StartDate);
            rule.EndDate = rule.EndDate.HasValue ? AsDateOnly(rule.EndDate.Value) : null;
        }

        private static DateTime AsDateOnly(DateTime value) =>
            DateTime.SpecifyKind(value.Date, DateTimeKind.Unspecified);

        public sealed record RuleStatusRequest(bool IsInactive, bool CatchUpMissed);
    }
}