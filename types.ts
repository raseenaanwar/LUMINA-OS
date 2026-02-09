export interface WellnessForecastItem {
  time: string;
  activity: string;
  status: 'Optimal' | 'Caution' | 'Action Required';
  rationale: string;
}

export interface MatterCommand {
  lighting: {
    target_kelvin: number;
    target_brightness: number;
    transition_mode: string;
    duration_seconds: number;
  };
  environment: {
    suggested_temperature: string;
    air_quality_note: string;
    noise_reduction: string;
  };
  devices: {
    screens: string;
    smart_blinds: string;
    ambient_sound: string;
  };
}

export interface EnvironmentalAnalysis {
  sleepScore: {
    current: number;
    optimized: number;
    improvement: number;
    description: string;
  };
  preSyncStatus: {
    kelvinRange: string;
    intensityDescription: string;
    luxEquivalent: string;
    stressors: string[];
    mismatchDescription: string;
  };
  postSyncProjection: {
    idealKelvin: string;
    targetIntensity: string;
    recoveryTime: string;
    expectedImprovement: string;
  };
  bioLogicImpact: {
    impactAssessment: string;
    melatoninReductionRange: string;
    sleepDelayRange: string;
    citation: string;
  };
  wellnessForecast: WellnessForecastItem[];
  activitySuggestion: {
    location: string;
    coordinates: string;
    suggestedTime: string;
    activity: string;
    rationale: string;
  };
  iotConcept: {
    target: string;
    integration: string;
    protocol: string;
    status: string;
    command: MatterCommand;
  };
  circadianPhase: string;
}

export interface HistoryItem {
  timestamp: string;
  source: 'live' | 'upload';
  analysis: EnvironmentalAnalysis;
  imageUrl: string;
}
