export const environment = {
  production: true,
  // apiUrl: 'https://api.gogotaxiapps.com/admin_v1/',
  // profileImageUrl: 'https://api.gogotaxiapps.com/uploads/profile_picture/large/',
  // vehicleImageUrl: 'https://api.gogotaxiapps.com/uploads/vehicle_photos/large/',
  // vehicleTypeImageUrl: 'https://api.gogotaxiapps.com/uploads/vehicle_types/',
  // countryFlagUrl: 'https://api.gogotaxiapps.com/uploads/country_flags/',

  apiUrl: 'http://3.17.0.81:7025/admin_v1/',
  profileImageUrl: 'http://3.17.0.81:7025/uploads/profile_picture/large/',
  vehicleImageUrl: 'http://3.17.0.81:7025/uploads/vehicle_photos/large/',
  vehicleTypeImageUrl: 'http://3.17.0.81:7025/uploads/vehicle_types/',
  countryFlagUrl: 'http://3.17.0.81:7025/uploads/country_flags/',
  // adminPermission: ["DASHBOARD", "PASSENGER", "DRIVER", "VEHICLE", "HELP_CENTER", "EMERGENCY", "BILLING_PLANS", "OPERATOR", "CREDIT", "DRIVER_RIDE","PASSENGER_RIDE","RIDES_HISTORY","REWARD_HISTORY","SETTING_PERMISSION"],
  adminPermission: ["DASHBOARD", "PASSENGER", "CHANGE_PASS", "DRIVER", "VEHICLE", "HELP_CENTER", "EMERGENCY", "BILLING_PLANS", "OPERATOR", "CREDIT", "DRIVER_RIDE", "PASSENGER_RIDE", "RIDES_HISTORY", "REWARD_HISTORY", "SETTING_PERMISSION", "HIERARCHY_HISTORY", "REFFERAL_EARNING", "NOTIFY", "ACTION_LOGS", "ADMIN", "NOTIFICATION_LOGS"],
  operatorPermission: ["DASHBOARD", "PASSENGER", "CHANGE_PASS", "DRIVER", "HELP_CENTER", "EMERGENCY", "BILLING_PLANS", "OPERATOR", "CREDIT"],
  // operatorPermission: ["PASSENGER", "DRIVER", "CREDIT"],
  default_map_zoom: 12
};
