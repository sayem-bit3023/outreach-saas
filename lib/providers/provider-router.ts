import { mockLeadProvider } from "./mock-provider";
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
  private readonly provider: LeadProvider = mockLeadProvider;

  async search(params: LeadProviderSearchParams): Promise<ProviderSearchResult> {
    const leads = await this.provider.search(params);
    return {
      provider: this.provider.getName(),
      leads,
    };
  }
}

export const providerRouter = new ProviderRouter();
