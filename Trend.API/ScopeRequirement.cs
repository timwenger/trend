using Microsoft.AspNetCore.Authorization;

namespace Trend.API
{
    public class ScopeRequirement : IAuthorizationRequirement
    {
        public string Issuer { get; }
        public string Scope { get; }

        /// <summary>
        /// The user should have the right scope, but also that scope
        /// should come from a trusted issuer / domain.
        /// </summary>
        public ScopeRequirement(string scope, string issuer)
        {
            Scope = scope ?? throw new ArgumentNullException(nameof(scope));
            Issuer = issuer ?? throw new ArgumentNullException(nameof(issuer));
        }
    }
}
