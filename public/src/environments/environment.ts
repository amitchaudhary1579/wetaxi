// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://3.17.0.81:7025/admin_v1/',
  // apiUrl: 'http://3.17.0.81:7025/admin_v1/',
  // apiUrl: 'http://192.168.2.251:7025/admin_v1/',
  profileImageUrl: 'http://3.17.0.81:7025/uploads/profile_picture/large/',
  vehicleImageUrl: 'http://3.17.0.81:7025/uploads/vehicle_photos/large/',
  vehicleTypeImageUrl: 'http://3.17.0.81:7025/uploads/vehicle_types/',
  countryFlagUrl: 'http://3.17.0.81:7025/uploads/country_flags/',
  adminPermission: ["DASHBOARD", "PASSENGER", "CHANGE_PASS", "DRIVER", "VEHICLE", "HELP_CENTER", "EMERGENCY", "BILLING_PLANS", "OPERATOR", "CREDIT", "DRIVER_RIDE", "PASSENGER_RIDE", "RIDES_HISTORY", "REWARD_HISTORY", "SETTING_PERMISSION", "HIERARCHY_HISTORY", "REFFERAL_EARNING", "NOTIFY", "ACTION_LOGS", "ADMIN", "NOTIFICATION_LOGS"],
  operatorPermission: ["DASHBOARD", "PASSENGER", "DRIVER", "CHANGE_PASS", "HELP_CENTER", "EMERGENCY", "BILLING_PLANS", "OPERATOR", "CREDIT"],
  // operatorPermission: ["PASSENGER", "DRIVER", "CREDIT"],
  default_map_zoom: 12
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
