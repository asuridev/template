
import { PartnerConfig } from "./interfaces/partner-config.interface";
import { cardifBancoOccidenteConfig } from "./partners/cardif-banco-occidente";



export const PARTNERS: Record<string, PartnerConfig> = {
  'cardif-banco-occidente': cardifBancoOccidenteConfig ,
  'globex': {
    primaryColor: '#2D6A4F',
    secondaryColor: '#52B788',
    accentColor: '#D8F3DC',
    backgroundColor: '#F8F9FA',
    textColor: '#1B1B1E',
    fontFamily: "'Inter', sans-serif",
    logoUrl: 'assets/logos/globex.svg',
    faviconUrl: 'assets/favicons/globex.ico',
    brandName: 'Globex Inc',
  },
  // agregar socios aquí...
};

export const DEFAULT_PARTNER = 'cardif-banco-occidente';
