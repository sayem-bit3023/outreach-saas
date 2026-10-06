import { mockLeadProvider } from "./mock-provider";
import { geoapifyProvider } from "./geoapify-provider";
import {
  LeadProvider,
  LeadProviderSearchParams,
  ProviderSearchResult,
} from "./types";

/**
 * Server-side provider selection boundary.
 *
 * The UI and API route do not need to know which provider is active. A real
 * provider can be added here later without changing the search experience.
 */
class ProviderRouter {
  private getProvider(): LeadProvider {
    return process.env.GEOAPIFY_API_KEY ? geoapifyProvider : mockLeadProvider;
  }

  async search(params: LeadProviderSearchParams): Promise<ProviderSearchResult> {
    const provider = this.getProvider();
    const leads = await provider.search(params);
    return {
      provider: provider.getName(),
      leads,
    };
  }
}

export const providerRouter = new ProviderRouter();
