using Microsoft.AspNetCore.Authorization;

namespace Trend.API
{
    /// <summary>
    /// The authorization handler evaluates the requirement against a provided 
    /// AuthorizationHandlerContext to determine if access is allowed
    /// </summary>
    public class ScopeHandler : AuthorizationHandler<ScopeRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, ScopeRequirement requirement)
        {
            const string scopeClaim = "scope";
            // If user does not have the scope claim, They will not be authorized
            if (!context.User.HasClaim(c => c.Type == scopeClaim && c.Issuer == requirement.Issuer))
                return Task.CompletedTask;

            // Split the scopes string into an array
            // the scope will not be null here, since we just checked that it has this claim above.
            var scopes = context.User.FindFirst(c => c.Type == scopeClaim && c.Issuer == requirement.Issuer)?.Value.Split(' ');

            // Mark the requirement as successful / passed if the user's scope array contains the required scope
            if (scopes.Any(s => s == requirement.Scope))
                context.Succeed(requirement);

            return Task.CompletedTask;
        }
    }
}
