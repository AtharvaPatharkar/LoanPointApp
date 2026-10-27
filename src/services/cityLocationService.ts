/**
 * City & Location Service for India States and Districts
 * Fetches and caches data from GitHub raw JSON configured in .env
 */

export interface DistrictItem {
  code: string;
  name: string;
}

export interface StateItem {
  code: string;
  name: string;
  districts: DistrictItem[];
}

export interface CityResultItem {
  city: string;
  state: string;
  stateCode: string;
}

const DEFAULT_URL =
  'https://raw.githubusercontent.com/codingmation/indian-states-districts/main/data/india_states_districts.min.json';

export const INDIA_CITIES_API_URL =
  process.env.EXPO_PUBLIC_INDIA_STATES_DISTRICTS_URL || DEFAULT_URL;

// Reliable fallback for key Maharashtra cities if device is offline
const FALLBACK_MAHARASHTRA_CITIES: CityResultItem[] = [
  'Nanded',
  'Mumbai',
  'Pune',
  'Nagpur',
  'Nashik',
  'Thane',
  'Chhatrapati Sambhajinagar',
  'Latur',
  'Parbhani',
  'Hingoli',
  'Jalna',
  'Beed',
  'Solapur',
  'Kolhapur',
  'Amravati',
  'Akola',
  'Ahmednagar',
  'Dhule',
  'Jalgaon',
  'Satara',
  'Sangli',
  'Chandrapur',
  'Yavatmal',
  'Wardha',
  'Bhandara',
  'Gondia',
  'Buldhana',
  'Washim',
  'Osmanabad (Dharashiv)',
  'Ratnagiri',
  'Sindhudurg',
  'Raigad',
  'Palghar',
  'Navi Mumbai',
  'Kalyan-Dombivli',
].map((name) => ({ city: name, state: 'Maharashtra', stateCode: 'MH' }));

class CityLocationService {
  private cachedData: StateItem[] | null = null;
  private flatCityList: CityResultItem[] = [];
  private isLoading = false;

  public async fetchCitiesData(): Promise<CityResultItem[]> {
    if (this.flatCityList.length > 0) {
      return this.flatCityList;
    }

    if (this.isLoading) {
      // If already fetching, wait a bit
      await new Promise((res) => setTimeout(res, 400));
      if (this.flatCityList.length > 0) return this.flatCityList;
    }

    this.isLoading = true;
    try {
      const response = await fetch(INDIA_CITIES_API_URL, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load cities: HTTP status ${response.status}`);
      }

      const statesData: StateItem[] = await response.json();
      this.cachedData = statesData;

      const flat: CityResultItem[] = [];
      statesData.forEach((st) => {
        if (Array.isArray(st.districts)) {
          st.districts.forEach((d) => {
            flat.push({
              city: d.name,
              state: st.name,
              stateCode: st.code,
            });
          });
        }
      });

      // Sort with priority: Maharashtra cities first (since Loan Point is based in Nanded, Maharashtra), then alphabetical
      flat.sort((a, b) => {
        const aIsMh = a.stateCode === 'MH' ? 0 : 1;
        const bIsMh = b.stateCode === 'MH' ? 0 : 1;
        if (aIsMh !== bIsMh) return aIsMh - bIsMh;
        return a.city.localeCompare(b.city);
      });

      this.flatCityList = flat;
      return flat;
    } catch (err) {
      console.warn('Could not fetch India cities from GitHub, using fallback:', err);
      return FALLBACK_MAHARASHTRA_CITIES;
    } finally {
      this.isLoading = false;
    }
  }

  public getFallbackCities(): CityResultItem[] {
    return FALLBACK_MAHARASHTRA_CITIES;
  }

  /**
   * Suggest cities matching the query (especially after 3+ characters).
   * Prioritizes exact prefix matches, followed by word starts and general contains.
   */
  public searchSuggestions(query: string, maxResults: number = 8): CityResultItem[] {
    const clean = query.trim().toLowerCase();
    if (clean.length < 3) {
      return [];
    }

    const list = this.flatCityList.length > 0 ? this.flatCityList : FALLBACK_MAHARASHTRA_CITIES;

    // 1. Prefix match (e.g., "Nan" -> "Nanded")
    const prefixMatches: CityResultItem[] = [];
    // 2. Substring match
    const otherMatches: CityResultItem[] = [];

    for (const item of list) {
      const cityNameLower = item.city.toLowerCase();
      if (cityNameLower.startsWith(clean)) {
        prefixMatches.push(item);
      } else if (cityNameLower.includes(clean) || item.state.toLowerCase().startsWith(clean)) {
        otherMatches.push(item);
      }

      if (prefixMatches.length >= maxResults) {
        break;
      }
    }

    const combined = [...prefixMatches, ...otherMatches].slice(0, maxResults);
    return combined;
  }

  /**
   * Validates if a user-typed city exists in the Indian states and districts JSON data.
   * Matches case-insensitively, handling exact names or district aliases.
   */
  public isValidCity(cityName: string): boolean {
    const clean = cityName.trim().toLowerCase();
    if (!clean) return false;

    const list = this.flatCityList.length > 0 ? this.flatCityList : FALLBACK_MAHARASHTRA_CITIES;
    return list.some((item) => {
      const c = item.city.toLowerCase();
      return (
        c === clean ||
        c.startsWith(clean) ||
        clean.startsWith(c) ||
        c.includes(clean)
      );
    });
  }

  /**
   * Checks if user has typed a completely invalid city (at least 3 characters entered,
   * but 0 matches found in all India cities & districts dataset).
   */
  public isWrongCity(cityName: string): boolean {
    const clean = cityName.trim().toLowerCase();
    if (clean.length < 3) return false;

    const list = this.flatCityList.length > 0 ? this.flatCityList : FALLBACK_MAHARASHTRA_CITIES;
    const hasAnyMatch = list.some((item) => {
      const c = item.city.toLowerCase();
      const s = item.state.toLowerCase();
      return c.includes(clean) || clean.includes(c) || s.includes(clean);
    });
    return !hasAnyMatch;
  }
}

export const cityLocationService = new CityLocationService();
