import { Injectable } from "@angular/core";

export interface NavigationItem {
  id: string;
  title: string;
  type: "item" | "collapse" | "group";
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  function?: any;
  badge?: {
    title?: string;
    type?: string;
  };
  children?: Navigation[];
}

export interface Navigation extends NavigationItem {
  children?: NavigationItem[];
}
const NavigationItems = [
      {
        id: "dashboard",
        title: "Dashboard",
        type: "item",
        icon: "feather icon-home",
        url: "/dashboard",
        permissionOnly: "DASHBOARD"
      },
      {
        id: "passenger",
        title: "Passenger",
        type: "item",
        icon: "feather icon-user",
        url: "/passenger/list-passenger/",
        permissionOnly: "PASSENGER"
      },
      {
        id: "driver",
        title: "Driver",
        type: "item",
        icon: "feather icon-user",
        url: "/driver/list-driver/",
        permissionOnly: "DRIVER"
      },
      {
        id: "vehicle",
        title: "Vehicle",
        type: "item",
        icon: "feather icon-book",
        url: "/vehicle/list-vehicle/",
        permissionOnly: "VEHICLE"
      },
      {
        id: "help center",
        title: "Help center",
        type: "item",
        icon: "feather icon-help-circle",
        url: "/help-center/list-help-center/",
        permissionOnly: "HELP_CENTER"
      },
      {
        id: "emergency",
        title: "Emergency",
        type: "item",
        icon: "feather icon-box",
        url: "/emergency/list-emergency/",
        permissionOnly: "HELP_CENTER"
      },
      {
        id: "billing plan",
        title: "Billing plan",
        type: "item",
        icon: "feather icon-file-text",
        url: "/billing-plan/list-billing-plan/",
        permissionOnly: "BILLING_PLANS"
      },
      {
        id: "operator",
        title: "Operator",
        type: "item",
        icon: "feather icon-clipboard",
        url: "/operator/list-operator/",
        permissionOnly: "OPERATOR"
      },
      {
        id: "credit",
        title: "Credit",
        type: "item",
        icon: "feather icon-credit-card",
        url: "/credit/list-credit/",
        permissionOnly: "CREDIT"
      },
      {
        id: 'navigation',
        title: 'Navigation',
        type: 'group',
        icon: 'icon-navigation',
        permissionOnly: "ADMIN",
        children: [
      {
        id: 'Ride History',
        title: 'Ride History',
        type: 'collapse',
        icon: 'feather icon-layers',
        permissionOnly: "RIDES_HISTORY",
        children: [
          {
            id: "Driver ride history",
            title: "Driver Ride",
            type: "item",
            url: "/ride/list-driver-ride/",
            permissionOnly: "RIDES_HISTORY"
          },
          {
            id: "Passenger ride history",
            title: "Passenger Ride",
            type: "item",
            url: "/rides/list-passenger-ride/",
            permissionOnly: "RIDES_HISTORY"
          },
          {
            id: "rides history",
            title: "All Rides",
            type: "item",
            url: "/history/ride-history/",
            permissionOnly: "RIDES_HISTORY"
          }
        ]
      },
      {
        id: 'Reward',
        title: 'Reward',
        type: 'collapse',
        icon: 'feather icon-gitlab',
        permissionOnly: "RIDES_HISTORY",
        children: [
          {
            id: "Reward Driver",
            title: "Driver Reward ",
            type: "item",
            url: "/reward/driver-reward/",
            permissionOnly: "REWARD_HISTORY"
          },
          {
            id: "Reward Passenger",
            title: "Passenger Reward",
            type: "item",
            url: "/rewards/passenger-reward/",
            permissionOnly: "REWARD_HISTORY"
          },
        ]
      },
      {
        id: 'Referral Hierarchy',
        title: 'Referral Hierarchy',
        type: 'collapse',
        icon: 'feather icon-server',
        permissionOnly: "HIERARCHY_HISTORY",
        children: [
          {
            id: "Hierarchy Driver",
            title: "Driver Hierarchy",
            type: "item",
            url: "/hierarchy/driver-hierarchy/",
            permissionOnly: "HIERARCHY_HISTORY"
          },
          {
            id: "Hierarchy Passenger",
            title: "Passenger Hierarchy",
            type: "item",
            url: "/hierarchys/passenger-hierarchy/",
            permissionOnly: "HIERARCHY_HISTORY"
          },
        ]
      },
      {
        id: 'Referral earnings',
        title: 'Referral Earnings',
        type: 'collapse',
        icon: 'feather icon-calendar',
        permissionOnly: "REFFERAL_EARNING",
        children: [
          {
            id: "earnings Driver",
            title: "Driver Earnings",
            type: "item",
            url: "/refferal/list-driver-refferal-earning/",
            permissionOnly: "REFFERAL_EARNING"
          },
          {
            id: "earnings Passenger",
            title: "Passenger Earnings",
            type: "item",
            url: "/refferals/list-passenger-refferal-earnings/",
            permissionOnly: "REFFERAL_EARNING"
          },
        ]
      },
      {
        id: 'Notification',
        title: 'Notification',
        type: 'collapse',
        icon: 'feather icon-check-square',
        permissionOnly: "NOTIFY",
        children: [
          {
            id: "Notification Driver",
            title: "Driver Notification",
            type: "item",
            url: "/notify/list-driver-notification/",
            permissionOnly: "NOTIFY"
          },
          {
            id: "Notification Passenger",
            title: "Passenger Notification",
            type: "item",
            url: "/notifys/list-passenger-notification/",
            permissionOnly: "NOTIFY"
          },
        ]
      },
      {
        id: "Action Logs",
        title: "Action Logs",
        type: "item",
        icon: "feather icon-file-plus",
        url: "/active/list-action-log/",
        permissionOnly: "ACTION_LOGS"
      },
      {
        id: "Notification Logs",
        title: "Notification Logs",
        type: "item",
        icon: "feather icon-aperture",
        url: "/notification/list-notification-log/",
        permissionOnly: "NOTIFICATION_LOGS"
      },
      {
        id: "setting",
        title: "Admin Setting",
        type: "item",
        icon: "feather icon-sliders",
        url: "/admins/admin-setting/",
        permissionOnly: "SETTING_PERMISSION"
      },
    ]
  }

];

@Injectable()
export class NavigationItem {
  get() {
    return NavigationItems;
  }
}
