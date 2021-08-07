import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
declare const AmCharts: any;
declare var $: any;

import '../../../assets/charts/amchart/amcharts.js';
import '../../../assets/charts/amchart/gauge.js';
import '../../../assets/charts/amchart/serial.js';
import '../../../assets/charts/amchart/light.js';
import '../../../assets/charts/amchart/pie.min.js';
import '../../../assets/charts/amchart/ammap.min.js';
import '../../../assets/charts/amchart/usaLow.js';
import '../../../assets/charts/amchart/radar.js';
import '../../../assets/charts/amchart/worldLow.js';
import { AuthService } from '../services/index.js';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';
import { ExcelService } from '../services/excel.service.js';
import { SettingService } from '../services/setting.service.js';

// just an interface for type safety.
interface marker {
  lat: number;
  lng: number;
  label?: string;
  draggable: boolean;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  public position = 'bottom-right';
  public dashboardData: any = {};
  public interval: any;
  public exportPassengerEarningExcel = [];
  public exportDriverEarningExcel = [];
  public exportPassengerRideExcel = [];
  public exportDriverRideExcel = [];
  public exportDriverReferralPeopleExcel = [];
  public exportPassengerReferralPeopleExcel = [];
  public maplivedata: any;
  public balanceData: any;
  public topTenData: any;
  public totalDate;
  public IncomeData;
  public daily = []
  public isSubmitted: boolean = false;
  public exportDailyExcel = []
  public exportMonthlyExcel = []
  public exportVahicleExcel = []
  exportDriverTopupExcel =[];
  exportDriverIncomeExcel =[];
  exportCompanyNetIncomeExcel = [];
  exportReferAndEarnExpanseExcel = [];
  @ViewChild('closeBtn') closeBtn;
  @ViewChild('modalDefault') modalDefault;
  @ViewChild('modalDefault1') modalDefault1;
  @ViewChild('modalDefault2') modalDefault2;
  @ViewChild('modalDefault3') modalDefault3;
  @ViewChild('modalDefault4') modalDefault4;
  @ViewChild('modalDefault5') modalDefault5;
  constructor(
    private authService: AuthService,
    private toastyService: ToastyService,
    private excelService: ExcelService,
    private settingService: SettingService
  ) {
  }


  // google maps zoom level
  zoom: number = environment.default_map_zoom;
  vehicleTypeImageUrl: any = environment.vehicleTypeImageUrl;

  // initial center position for the map
  lat: number = 11.565442;
  lng: number = 104.9169263;
  markers: marker[] = [];

  clickedMarker(label: string, index: number) {

  }
  openModals() {
    this.isSubmitted = false;
    this.modalDefault.show();
  }
  openModals1() {
    this.isSubmitted = false;
    this.modalDefault1.show();
  }
  openModals2() {
    this.isSubmitted = false;
    this.modalDefault2.show();
  }
  openModals3() {
    this.isSubmitted = false;
    this.modalDefault3.show();
  }
  openModals4() {
    this.isSubmitted = false;
    this.modalDefault4.show();
  }
  openModals5() {
    this.isSubmitted = false;
    this.modalDefault5.show();
  }

  // mapClicked($event: MouseEvent) {
  //   // this.markers.push({
  //   //   lat: $event.coords.lat,
  //   //   lng: $event.coords.lng,
  //   //   draggable: true
  //   // });
  // }

  markerDragEnd(m: marker, $event: MouseEvent) {

  }

  onMouseOver(infoWindow, $event: MouseEvent) {
    infoWindow.open();
  }

  onMouseOut(infoWindow, $event: MouseEvent) {
    infoWindow.close();
  }

  getDashboardData() {
    // this.loading = true;
    this.authService.getDashboardData().subscribe(
      respone => {
        // this.loading = false;
        this.dashboardData = JSON.parse(JSON.stringify(respone.data));
        // this.lng = this.dashboardData.drivers[0].location.coordinates[0];
        // this.lat = this.dashboardData.drivers[0].location.coordinates[1];
        var now = new Date();
        this.daily = [];
        let testarray = [];
        this.totalDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        for (let index = 0; index < this.dashboardData.dailyEarning.length; index++) {
          testarray.push(this.dashboardData.dailyEarning[index].date)
        }
        for (let index = 0; index < Number(this.totalDate); index++) {
          let i = index + 1;
          if (testarray.indexOf(i) != -1) {
            this.daily.push({ "date": this.dashboardData.dailyEarning[testarray.indexOf(i)].date, "totalEarning": Math.round(this.dashboardData.dailyEarning[testarray.indexOf(i)].totalEarning) })
          } else {
            this.daily.push({ "date": i, "totalEarning": 0 })
          }
        }

        // for (let index = 0; index < this.dashboardData.monthlyEarning.length; index++) {
        //   this.dashboardData.monthlyEarning[index].issetmonthname = moment().month(this.dashboardData.monthlyEarning[index].month - 1).format("MMMM") + "-" + this.dashboardData.monthlyEarning[index].year;
        // }

        for (let index = 0; index < this.dashboardData.totalVehicleType.length; index++) {
          this.dashboardData.totalVehicleType[index].isvehiclename = this.dashboardData.totalVehicleType[index].type.en;
        }
      },
      error => {
        // this.loading = false;
        this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
      }
    );
  }

  imgErrorHandler(event) {
    event.target.src = environment.profileImageUrl + 'default.png';
  }

  getLowBalance() {
    this.loading = true;
    let demo = "admin Fee";
    this.settingService.GetAdminFee(demo).subscribe(
      respone => {
        this.loading = false;
        this.balanceData = respone.data.driverMinimumBalance;
      },
      error => {
        this.loading = false;
        // this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
      }
    );
  }

  exportAsXLSX_Daily(): void {
    if (this.exportDailyExcel.length == 0) {
      let testarray = [];
      for (let index = 0; index < this.dashboardData.dailyEarning.length; index++) {
        testarray.push(this.dashboardData.dailyEarning[index].date)
      }
      for (let index = 0; index < Number(this.totalDate); index++) {
        if (this.dashboardData.dailyEarning.length == 0) {
          let i = index + 1;
          this.exportDailyExcel.push({ "Date": i + "-" + moment().format('MM') + "-" + moment().format('YYYY'), "TotalEarning": 0 })
        } else {
          let i = index + 1;
          if (testarray.indexOf(i) != -1) {
            this.exportDailyExcel.push({ "Date": this.dashboardData.dailyEarning[testarray.indexOf(i)].date + "-" + this.dashboardData.dailyEarning[testarray.indexOf(i)].month + "-" + this.dashboardData.dailyEarning[testarray.indexOf(i)].year, "TotalEarning": this.dashboardData.dailyEarning[testarray.indexOf(i)].totalEarning })
          } else {
            this.exportDailyExcel.push({ "Date": i + "-" + this.dashboardData.dailyEarning[0].month + "-" + this.dashboardData.dailyEarning[0].year, "TotalEarning": 0 })
          }
        }
      }
    }
    this.excelService.exportAsExcelFile(this.exportDailyExcel, 'DailyIncome');
  }

  exportAsXLSX_PassengerEarning() {
    this.topTenData.topTenPassengerByRideSpentMoney.map(element => {
      this.exportPassengerEarningExcel.push({ 'AutoId': element.autoIncrementID, 'PassengerId': element.uniqueID, 'Email': element.email, 'Name': element.name, 'PassengerEarning': element.passengerEarning, 'CountryCode': element.countryCode, 'PhoneNumber': element.onlyPhoneNumber, 'DateOfBirth': moment(element.dob).format('YYYY-MM-DD'), 'RegisterDate': moment(element.createdAt).format('YYYY-MM-DD') })
    });
    this.excelService.exportAsExcelFile(this.exportPassengerEarningExcel, 'PassengerEarning');
  }

  exportAsXLSX_PassengerRide() {
    this.topTenData.topTenPassengerByCompletedRide.map(element => {
      this.exportPassengerRideExcel.push({ 'AutoId': element.autoIncrementID, 'PassengerId': element.uniqueID, 'Email': element.email, 'Name': element.name, 'PassengerRide': element.totalCompletedRide, 'CountryCode': element.countryCode, 'PhoneNumber': element.onlyPhoneNumber, 'DateOfBirth': moment(element.dob).format('YYYY-MM-DD'), 'RegisterDate': moment(element.createdAt).format('YYYY-MM-DD') })
    });
    this.excelService.exportAsExcelFile(this.exportPassengerRideExcel, 'PassengerRide');
  }

  exportAsXLSX_DriverReferralPeopleCount() {
    this.topTenData.topTenDriverByTotalInvited.map(element => {
      this.exportDriverReferralPeopleExcel.push({ 'AutoId': element.autoIncrementID, 'VehicleId': element.uniqueID, 'Email': element.email, 'Name': element.name, 'DriverReferralCount': element.totalInvitedCount, 'Ratting': element.avgRating, 'Credit': element.creditBalance, 'CountryCode': element.countryCode, 'PhoneNumber': element.onlyPhoneNumber, 'DateOfBirth': moment(element.dob).format('YYYY-MM-DD'), 'RegisterDate': moment(element.createdAt).format('YYYY-MM-DD') })
    });
    this.excelService.exportAsExcelFile(this.exportDriverReferralPeopleExcel, 'DriverReferralPeopleCount');
  }

  exportAsXLSX_PassengerReferralPeopleCount() {
    this.topTenData.topTenPassengerByTotalInvited.map(element => {
      this.exportPassengerReferralPeopleExcel.push({ 'AutoId': element.autoIncrementID, 'PassengerId': element.uniqueID, 'Email': element.email, 'Name': element.name, 'PassengerReferralCount': element.totalInvitedCount, 'CountryCode': element.countryCode, 'PhoneNumber': element.onlyPhoneNumber, 'DateOfBirth': moment(element.dob).format('YYYY-MM-DD'), 'RegisterDate': moment(element.createdAt).format('YYYY-MM-DD') })
    });
    this.excelService.exportAsExcelFile(this.exportPassengerReferralPeopleExcel, 'PassengerReferralPeopleCount');
  }

  exportAsXLSX_DriverEarning() {
    this.topTenData.topTenDriverByDrivingMoney.map(element => {
      this.exportDriverEarningExcel.push({ 'AutoId': element.autoIncrementID, 'VehicleId': element.uniqueID, 'Email': element.email, 'Name': element.name, 'DriverEarning': element.driverEarning, 'Ratting': element.avgRating, 'Credit': element.creditBalance, 'CountryCode': element.countryCode, 'PhoneNumber': element.onlyPhoneNumber, 'DateOfBirth': moment(element.dob).format('YYYY-MM-DD'), 'RegisterDate': moment(element.createdAt).format('YYYY-MM-DD') })
    });
    this.excelService.exportAsExcelFile(this.exportDriverEarningExcel, 'DriverEarning');
  }

  exportAsXLSX_DriverRide() {
    this.topTenData.topTenDriverByCompletedRide.map(element => {
      this.exportDriverRideExcel.push({ 'AutoId': element.autoIncrementID, 'VehicleId': element.uniqueID, 'Email': element.email, 'Name': element.name, 'DriverRide': element.totalCompletedRide, 'Ratting': element.avgRating, 'Credit': element.creditBalance, 'CountryCode': element.countryCode, 'PhoneNumber': element.onlyPhoneNumber, 'DateOfBirth': moment(element.dob).format('YYYY-MM-DD'), 'RegisterDate': moment(element.createdAt).format('YYYY-MM-DD') })
    });
    this.excelService.exportAsExcelFile(this.exportDriverRideExcel, 'DriverRide');
  }

  // exportAsXLSX_Monthly(): void {
  //   if (this.exportMonthlyExcel.length == 0) {
  //     for (let index = 0; index < this.dashboardData.monthlyEarning.length; index++) {
  //       this.exportMonthlyExcel.push({ "Month": moment().month(this.dashboardData.monthlyEarning[index].month - 1).format("MMMM") + "-" + this.dashboardData.monthlyEarning[index].year, "TotalEarning": this.dashboardData.monthlyEarning[index].totalEarning })
  //     }
  //   }
  //   this.excelService.exportAsExcelFile(this.exportMonthlyExcel, 'MonthlyIncome');
  // }

  exportAsXLSX_Yearly(): void {
    this.excelService.exportAsExcelFile(this.dashboardData.yearlyEarning, 'YearlyIncome');
  }

  
  exportAsXLSX_DriverTopup(): void {
    this.exportDriverTopupExcel.push({ 'Driver Credit Today':  this.IncomeData.DriverCredit.todays, 'Driver Credit Yesterday': this.IncomeData.DriverCredit.yesterDays, 'Driver Credit This month': this.IncomeData.DriverCredit.thisMonths, 'Driver Credit Last month': this.IncomeData.DriverCredit.lastMonths, 'Driver Credit This Year': this.IncomeData.DriverCredit.thisYears, 'Driver Credit Last Year': this.IncomeData.DriverCredit.lastYears })
    this.excelService.exportAsExcelFile(this.exportDriverTopupExcel, 'Income Driver Top up');
  }
  exportAsXLSX_DriverIncome(): void {
    this.exportDriverIncomeExcel.push({ 'Driver Income Today':  this.IncomeData.DriverIncome.todays, 'Driver Income Yesterday': this.IncomeData.DriverIncome.yesterDays, 'Driver Income This month': this.IncomeData.DriverIncome.thisMonths, 'Driver Income Last month': this.IncomeData.DriverIncome.lastMonths, 'Driver Income This Year': this.IncomeData.DriverIncome.thisYears, 'Driver Income Last Year': this.IncomeData.DriverIncome.lastYears })
    this.excelService.exportAsExcelFile(this.exportDriverIncomeExcel, ' Driver Income');
  }
  exportAsXLSX_CompanyNetIncome(): void {
    this.exportCompanyNetIncomeExcel.push({ 'Company Net Income Today':  this.IncomeData.AdminIncome.todays, 'Company Net Income Yesterday': this.IncomeData.AdminIncome.yesterDays, 'Company Net Income This month': this.IncomeData.AdminIncome.thisMonths, 'Company Net Income Last month': this.IncomeData.AdminIncome.lastMonths, 'Company Net Income This Year': this.IncomeData.AdminIncome.thisYears, 'Company Net Income Last Year': this.IncomeData.AdminIncome.lastYears })
    this.excelService.exportAsExcelFile(this.exportCompanyNetIncomeExcel, ' Company Net Income');
  }
  exportAsXLSX_ReferAndEarnExpanse(): void {
    this.exportReferAndEarnExpanseExcel.push({ 'Refer And Earn Today':  this.IncomeData.DriverRefEarn.todays, 'Refer And Earn Yesterday': this.IncomeData.DriverRefEarn.yesterDays, 'Refer And Earn This month': this.IncomeData.DriverRefEarn.thisMonths, 'Refer And Earn Last month': this.IncomeData.DriverRefEarn.lastMonths, 'Refer And Earn This Year': this.IncomeData.DriverRefEarn.thisYears, 'Refer And Earn Last Year': this.IncomeData.DriverRefEarn.lastYears })
    this.excelService.exportAsExcelFile(this.exportReferAndEarnExpanseExcel, 'Refer And Earn Expanse');
  }

  exportAsXLSX_Vehicle(): void {
    if (this.exportVahicleExcel.length == 0) {
      for (let index = 0; index < this.dashboardData.totalVehicleType.length; index++) {
        this.exportVahicleExcel.push({ "VehicleName": this.dashboardData.totalVehicleType[index].type.en, "VehicleCount": this.dashboardData.totalVehicleType[index].count })
      }
    }
    this.excelService.exportAsExcelFile(this.exportVahicleExcel, 'VehicleInfo');
  }

  addToast(options) {
    if (options.closeOther) {
      this.toastyService.clearAll();
    }
    this.position = options.position ? options.position : this.position;
    const toastOptions: ToastOptions = {
      title: options.title,
      msg: options.msg,
      showClose: options.showClose,
      timeout: options.timeout,
      theme: options.theme,
      onAdd: (toast: ToastData) => {
      },
      onRemove: (toast: ToastData) => {
      }
    };

    switch (options.type) {
      case 'default': this.toastyService.default(toastOptions); break;
      case 'info': this.toastyService.info(toastOptions); break;
      case 'success': this.toastyService.success(toastOptions); break;
      case 'wait': this.toastyService.wait(toastOptions); break;
      case 'error': this.toastyService.error(toastOptions); break;
      case 'warning': this.toastyService.warning(toastOptions); break;
    }
  }

  getMapData() {
    this.authService.getDashboardMapData().subscribe(
      respone => {
        this.maplivedata = respone.data;
        for (let index = 0; index < this.maplivedata.length; index++) {
          if (this.maplivedata[index].isAvailable) {
            this.maplivedata[index].issetimage = environment.vehicleTypeImageUrl + "car_green.png";
          } else {
            this.maplivedata[index].issetimage = environment.vehicleTypeImageUrl + "car_red.png";
          }
        }
        this.markers = this.maplivedata.map(function (driver) {
          return {
            uniqueID: driver.uniqueID, lat: driver.location.coordinates[1], lng: driver.location.coordinates[0], name: driver.name, vehicleType: driver.vehicle && driver.vehicle.typeId && driver.vehicle.typeId.type && driver.vehicle.typeId.type.en, rotation: 60, direction: driver.location.angle, zIndex: driver.location.angle,
            iconUrl: {
              url: driver.issetimage,
              scaledSize: {
                width: 30,
                height: 35
              },
              offset: '0'
            }
          }
        });
      },
      error => {
        // this.loading = false;
        // this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
      }
    );
  }

  getIncomeRelatedata(){
    this.authService.getIncomeRelatedData().subscribe(
      respone => {
        this.IncomeData = respone.data;
      },
      error => {
        // this.loading = false;
        // this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
      }
    );
  }

  getTopTenData() {
    this.authService.getTopTenDriverAndPassengerData().subscribe(
      respone => {
        this.topTenData = respone.data;

        for (let index = 0; index < this.topTenData.topTenDriverByCompletedRide.length; index++) {
          if (this.balanceData >= this.topTenData.topTenDriverByCompletedRide[index].creditBalance) {
            this.topTenData.topTenDriverByCompletedRide[index].isSame = true;
          } else {
            this.topTenData.topTenDriverByCompletedRide[index].isSame = false;
          }
        }
        for (let index = 0; index < this.topTenData.topTenDriverByTotalInvited.length; index++) {
          if (this.balanceData >= this.topTenData.topTenDriverByTotalInvited[index].creditBalance) {
            this.topTenData.topTenDriverByTotalInvited[index].isSame = true;
          } else {
            this.topTenData.topTenDriverByTotalInvited[index].isSame = false;
          }
        }
        for (let index = 0; index < this.topTenData.topTenDriverByDrivingMoney.length; index++) {
          if (this.balanceData >= this.topTenData.topTenDriverByDrivingMoney[index].creditBalance) {
            this.topTenData.topTenDriverByDrivingMoney[index].isSame = true;
          } else {
            this.topTenData.topTenDriverByDrivingMoney[index].isSame = false;
          }
        }
        for (let index = 0; index < this.topTenData.topTenDriverByDrivingMoney.length; index++) {
          if (moment().format('D') == moment(this.topTenData.topTenDriverByDrivingMoney[index].dob).format('D') && moment().format('MMMM') == moment(this.topTenData.topTenDriverByDrivingMoney[index].dob).format('MMMM')) {
            this.topTenData.topTenDriverByDrivingMoney[index].isSelected = true;
          } else {
            this.topTenData.topTenDriverByDrivingMoney[index].isSelected = false;
          }
        }
        for (let index = 0; index < this.topTenData.topTenDriverByCompletedRide.length; index++) {
          if (moment().format('D') == moment(this.topTenData.topTenDriverByCompletedRide[index].dob).format('D') && moment().format('MMMM') == moment(this.topTenData.topTenDriverByCompletedRide[index].dob).format('MMMM')) {
            this.topTenData.topTenDriverByCompletedRide[index].isSelected = true;
          } else {
            this.topTenData.topTenDriverByCompletedRide[index].isSelected = false;
          }
        }
        for (let index = 0; index < this.topTenData.topTenDriverByTotalInvited.length; index++) {
          if (moment().format('D') == moment(this.topTenData.topTenDriverByTotalInvited[index].dob).format('D') && moment().format('MMMM') == moment(this.topTenData.topTenDriverByTotalInvited[index].dob).format('MMMM')) {
            this.topTenData.topTenDriverByTotalInvited[index].isSelected = true;
          } else {
            this.topTenData.topTenDriverByTotalInvited[index].isSelected = false;
          }
        }

        for (let index = 0; index < this.topTenData.topTenPassengerByRideSpentMoney.length; index++) {
          if (moment().format('D') == moment(this.topTenData.topTenPassengerByRideSpentMoney[index].dob).format('D') && moment().format('MMMM') == moment(this.topTenData.topTenPassengerByRideSpentMoney[index].dob).format('MMMM')) {
            this.topTenData.topTenPassengerByRideSpentMoney[index].isSelected = true;
          } else {
            this.topTenData.topTenPassengerByRideSpentMoney[index].isSelected = false;
          }
        }
        for (let index = 0; index < this.topTenData.topTenPassengerByCompletedRide.length; index++) {
          if (moment().format('D') == moment(this.topTenData.topTenPassengerByCompletedRide[index].dob).format('D') && moment().format('MMMM') == moment(this.topTenData.topTenPassengerByCompletedRide[index].dob).format('MMMM')) {
            this.topTenData.topTenPassengerByCompletedRide[index].isSelected = true;
          } else {
            this.topTenData.topTenPassengerByCompletedRide[index].isSelected = false;
          }
        }
        for (let index = 0; index < this.topTenData.topTenPassengerByTotalInvited.length; index++) {
          if (moment().format('D') == moment(this.topTenData.topTenPassengerByTotalInvited[index].dob).format('D') && moment().format('MMMM') == moment(this.topTenData.topTenPassengerByTotalInvited[index].dob).format('MMMM')) {
            this.topTenData.topTenPassengerByTotalInvited[index].isSelected = true;
          } else {
            this.topTenData.topTenPassengerByTotalInvited[index].isSelected = false;
          }
        }


      },
      error => {
        // this.loading = false;
        // this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
      }
    );

  }

  ngOnInit() {
    this.getLowBalance();
    this.getTopTenData();
    this.getDashboardData();
    // this.getMapData();
    this.getIncomeRelatedata();

    // this.interval = setInterval(() => {
    //   this.getMapData();
    // }, 10000);

    //line chart

    // setTimeout(() => {
    //   AmCharts.makeChart('line-area2', {
    //     'type': 'serial',
    //     'theme': 'light',
    //     'marginTop': 10,
    //     'marginRight': 0,
    //     'dataProvider': this.daily,
    //     'graphs': [{
    //       'id': 'g1',
    //       'balloonText': 'Date [[category]]<br><b><span style="font-size:14px;">KHR [[value]]</span></b>',
    //       'bullet': 'round',
    //       'lineColor': '#1de9b6',
    //       'lineThickness': 3,
    //       'negativeLineColor': '#1de9b6',
    //       'valueField': 'totalEarning'
    //     }
    //     ],
    //     'categoryField': 'date',
    //     'categoryAxis': {
    //       'minorGridAlpha': 0,
    //       'minorGridEnabled': true,
    //       'gridAlpha': 0,
    //       'axisAlpha': 0,
    //       'lineAlpha': 0
    //     }
    //   });
    // }, 1500);

    //bar chart

    // setTimeout(() => {
    //   AmCharts.makeChart('bar-chart3', {
    //     'type': 'serial',
    //     'theme': 'light',
    //     'marginTop': 10,
    //     'marginRight': 0,
    //     'valueAxes': [{
    //       'id': 'v1',
    //       'position': 'left',
    //       'gridAlpha': 0,
    //       'axisAlpha': 0,
    //       'lineAlpha': 0,
    //       'autoGridCount': false,
    //       'labelFunction': function (value) {
    //         return +Math.round(value);
    //       }
    //     }],
    //     'graphs': [
    //       {
    //         'id': 'g1',
    //         'valueAxis': 'v1',
    //         'lineColor': ['#1de9b6', '#1dc4e9'],
    //         'fillColors': ['#1de9b6', '#1dc4e9'],
    //         'fillAlphas': 1,
    //         'type': 'column',
    //         'title': 'Month',
    //         'valueField': 'totalEarning',
    //         'columnWidth': 0.2,
    //         'legendValueText': 'KHR [[value]]',
    //         'balloonText': '[[category]]<br /><b style="font-size: 130%">KHR [[value]]</b>'
    //       }
    //     ],
    //     // 'chartCursor': {
    //     //   'pan': true,
    //     //   'valueLineEnabled': true,
    //     //   'valueLineBalloonEnabled': true,
    //     //   'cursorAlpha': 0,
    //     //   'valueLineAlpha': 0.2
    //     // },

    //     'categoryField': 'issetmonthname',
    //     'categoryAxis': {
    //       'dashLength': 1,
    //       'gridAlpha': 0,
    //       'axisAlpha': 0,
    //       'lineAlpha': 0,
    //       'minorGridEnabled': true
    //     },
    //     // 'legend': {
    //     //   'useGraphSettings': true,
    //     //   'position': 'top'
    //     // },
    //     'balloon': {
    //       'borderThickness': 1,
    //       'shadowAlpha': 0
    //     },
    //     'dataProvider': this.dashboardData.monthlyEarning
    //   });
    // }, 1500);

    // setTimeout(() => {
    //   AmCharts.makeChart('bar-chart4', {
    //     'type': 'serial',
    //     'theme': 'light',
    //     'marginTop': 10,
    //     'marginRight': 0,
    //     'valueAxes': [{
    //       'id': 'v1',
    //       'position': 'left',
    //       'gridAlpha': 0,
    //       'axisAlpha': 0,
    //       'lineAlpha': 0,
    //       'autoGridCount': false,
    //       'labelFunction': function (value) {
    //         return +Math.round(value);
    //       }
    //     }],
    //     'graphs': [
    //       {
    //         'id': 'g1',
    //         'valueAxis': 'v1',
    //         'lineColor': ['#1de9b6', '#1dc4e9'],
    //         'fillColors': ['#1de9b6', '#1dc4e9'],
    //         'fillAlphas': 1,
    //         'type': 'column',
    //         'title': 'Year',
    //         'valueField': 'totalEarning',
    //         'columnWidth': 0.2,
    //         'legendValueText': 'KHR [[value]]',
    //         'balloonText': '[[title]] [[category]]<br /><b style="font-size: 130%">KHR [[value]]</b>'
    //       }
    //     ],
    //     // 'chartCursor': {
    //     //   'pan': true,
    //     //   'valueLineEnabled': true,
    //     //   'valueLineBalloonEnabled': true,
    //     //   'cursorAlpha': 0,
    //     //   'valueLineAlpha': 0.2
    //     // },
    //     'categoryField': 'year',
    //     'categoryAxis': {
    //       'dashLength': 1,
    //       'gridAlpha': 0,
    //       'axisAlpha': 0,
    //       'lineAlpha': 0,
    //       'minorGridEnabled': true
    //     },
    //     // 'legend': {
    //     //   'useGraphSettings': true,
    //     //   'position': 'top'
    //     // },
    //     'balloon': {
    //       'borderThickness': 1,
    //       'shadowAlpha': 0
    //     },
    //     'dataProvider': this.dashboardData.yearlyEarning
    //   });
    // }, 1500);

    setTimeout(() => {
      AmCharts.makeChart('bar-chart5', {
        'type': 'serial',
        'theme': 'light',
        'marginTop': 10,
        'marginRight': 0,
        'valueAxes': [{
          'id': 'v1',
          'position': 'left',
          'gridAlpha': 0,
          'axisAlpha': 0,
          'lineAlpha': 0,
          'autoGridCount': false,
          'labelFunction': function (value) {
            return +Math.round(value);
          }
        }],
        'graphs': [
          {
            'id': 'g1',
            'valueAxis': 'v1',
            'lineColor': ['#1de9b6', '#1dc4e9'],
            'fillColors': ['#1de9b6', '#1dc4e9'],
            'fillAlphas': 1,
            'type': 'column',
            'title': 'Year',
            'valueField': 'count',
            'columnWidth': 0.2,
            'legendValueText': 'Count [[value]]',
            'balloonText': '[[category]]<br /><b style="font-size: 130%">Count [[value]]</b>'
          }
        ],
        // 'chartCursor': {
        //   'pan': true,
        //   'valueLineEnabled': true,
        //   'valueLineBalloonEnabled': true,
        //   'cursorAlpha': 0,
        //   'valueLineAlpha': 0.2
        // },
        'categoryField': 'isvehiclename',
        'categoryAxis': {
          'dashLength': 1,
          'gridAlpha': 0,
          'axisAlpha': 0,
          'lineAlpha': 0,
          'minorGridEnabled': true
        },
        // 'legend': {
        //   'useGraphSettings': true,
        //   'position': 'top'
        // },
        'balloon': {
          'borderThickness': 1,
          'shadowAlpha': 0
        },
        'dataProvider': this.dashboardData.totalVehicleType
      });
    }, 2000);

  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }
}
