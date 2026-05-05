export interface SoilData {
  ph: number;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  soilType: string;
  region: string;
  district?: string;
}

export interface Crop {
  id: number;
  name: string;
  type: string;
  ideal_ph_min: number;
  ideal_ph_max: number;
  nitrogen_req: string;
  phosphorus_req: string;
  potassium_req: string;
  climate: string;
  growing_days: number;
  estimated_cost_per_acre: number;
  description: string;
}

export interface AnalysisResult {
  explanation: string;
  soilCondition: string;
  recommendations: string[];
  fertilizers: {
    chemical: string[];
    natural: string[];
  };
  risks: string[];
  phCorrection?: {
    required: boolean;
    treatment: string;
    quantityPerAcre: string;
    estimatedCostPerAcre: string;
    instructions: string;
  };
}

export interface WeatherData {
  current: {
    temp: number;
    description: string;
    humidity: number;
    windSpeed: number;
    icon: string;
  };
  historical: {
    date: string;
    temp: number;
    condition: string;
  }[];
  forecast: {
    date: string;
    temp: number;
    condition: string;
  }[];
}

export interface SoilLab {
  name: string;
  address: string;
  contact: string;
  type: "Government" | "Private";
  distance?: string;
  location?: {
    lat: number;
    lng: number;
  };
}
