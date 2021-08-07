import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { PassengerService, AuthService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { ExcelService } from '../../services/excel.service';
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'list-passenger',
  templateUrl: './list-passenger.component.html'
})
export class ListPassengerComponent implements AfterViewInit, OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  passengers;
  profilePhotoUrl: any;
  exportPassengerExcel = [];
  submitted = false;
  filterForm = this.fb.group({
    fromDate: ['', Validators.required],
    toDate: ['', Validators.required]
  });
  filterValue: any = {};

  constructor(
    private passengerService: PassengerService,
    private toastyService: ToastyService,
    private authService: AuthService,
    private excelService: ExcelService,
    private fb: FormBuilder,
    config: NgbDatepickerConfig
  ) {
    config.minDate = { year: 1900, month: 1, day: 1 };
    config.maxDate = { year: (new Date()).getFullYear(), month: (new Date()).getMonth() + 1, day: (new Date()).getDate() };
  }

  ngOnInit() {
    this.profilePhotoUrl = environment.profileImageUrl;
    this.authService.clearDataTableData("DataTables_passenger_management");
    this.loading = true;
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      order: [0, 'desc'],
      serverSide: true,
      processing: false,
      stateSave: true,
      stateSaveCallback: function (settings, data) {
        localStorage.setItem(
          "DataTables_passenger_management",
          JSON.stringify(data)
        );
      },
      stateLoadCallback: function (settings) {
        return JSON.parse(localStorage.getItem("DataTables_passenger_management"));
      },
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters.search.value = dataTablesParameters.search.value.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
        dataTablesParameters.filter = this.filterValue;
        this.passengerService.ListOfAllPassengers(dataTablesParameters).subscribe(
          resp => {
            this.loading = false;
            this.passengers = resp.data;
            for (let index = 0; index < this.passengers.length; index++) {
              if (moment().format('D') == moment(this.passengers[index].dob).format('D') && moment().format('MMMM') == moment(this.passengers[index].dob).format('MMMM')) {
                this.passengers[index].isSelected = true;
              } else {
                this.passengers[index].isSelected = false;
              }
            }
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: []
            });
          },
          error => {
            this.loading = false;
            this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
          }
        );
      },
      columns: [
        { data: "autoIncrementID" },
        { data: "uniqueID", orderable: false },
        { data: "email" },
        { data: "name" },
        { data: "countryCode" },
        { data: "onlyPhoneNumber" },
        { data: "dob", searchable: false },
        { data: "createdAt", searchable: false },
        { data: "profilePhoto", orderable: false },
        { data: "actions", orderable: false, searchable: false },
        { data: "refferal hierarchy actions", orderable: false, searchable: false },
        { data: "refferal earning actions", orderable: false, searchable: false },
        { data: "ride actions", orderable: false, searchable: false }
      ]
    };
  }
  imgErrorHandler(event) {
    event.target.src = this.profilePhotoUrl + 'default.png';
  }

  exportAsXLSX_Passenger() {
    this.passengerService.ListOfAllPassengers({ filter: this.filterValue }).subscribe(
      resp => {
        resp.data.map(element => {
          this.exportPassengerExcel.push({ 'PassengerId': element.uniqueID, 'Email': element.email, 'Name': element.name, 'CountryCode': element.countryCode, 'PhoneNumber': element.onlyPhoneNumber, 'DateOfBirth': element.dob, 'RegisterDate': moment(element.createdAt).format('YYYY-MM-DD'), 'TotalInvitedCount': element.totalInvitedCount, 'TotalReferralEarning': element.totalReferralEarning, 'TotalRideEarning': element.totalRideEarning })
        });
        this.excelService.exportAsExcelFile(this.exportPassengerExcel, 'PassengerDetails');
      },
      error => {
        this.loading = false;
        this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
      }
    );
  }

  levelnotfound() {
    Swal({
      title: 'Bottom line !!',
      type: 'info',
      showCloseButton: true,
      showCancelButton: false
    }).then((willDelete) => {
    });
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

  blockUnblockPassenger(passenger: any) {
    let text;
    if (passenger.isBlocked) {
      text = 'You want to unblock this passenger ?';
    } else {
      text = 'You want to block this passenger ?';
    }

    Swal({
      title: 'Are you sure?',
      text: text,
      type: 'warning',
      showCloseButton: true,
      showCancelButton: true
    }).then((willDelete) => {
      if (willDelete && !willDelete.dismiss) {
        let data = {
          'passenger_id': passenger._id
        }
        this.passengerService.blockUnblockPassenger(data).subscribe(
          next => {
            if (next.status_code == 200) {
              this.rerender();
              if (passenger.isBlocked) {
                Swal('Success', "Passenger unblocked successfully.", 'success');
              } else {
                Swal('Success', "Passenger blocked successfully.", 'success');
              }
            } else {
              Swal('Error', next.message, 'error');
            }
          },
          error => {
            Swal('Error', error.message, 'error');
          }
        );
      } else {

      }
    });
  }

  ngAfterViewInit(): void {
    this.dtTrigger.next();
  }

  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next();
    });
  }

  filterList() {
    this.submitted = true;

    if (this.filterForm.status == "INVALID")
      return;

    let { fromDate, toDate } = this.filterForm.value;

    this.filterValue = {
      fromDate: moment().utc().year(fromDate.year).month(fromDate.month - 1).date(fromDate.day).hours(0).minutes(0).seconds(0).milliseconds(0).toISOString(),
      toDate: moment().utc().year(toDate.year).month(toDate.month - 1).date(toDate.day).hours(23).minutes(59).seconds(59).milliseconds(999).toISOString()
    };

    this.rerender();
  }

  resetFilter() {
    this.submitted = false;
    this.filterValue = {}
    this.filterForm.reset();
    this.rerender();
  }

}
