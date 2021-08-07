import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CreditService, AuthService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { Router, ActivatedRoute } from '@angular/router';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { Validation } from '../../helper/validation';
import { environment } from 'src/environments/environment';

class Credit {
  public amount?: string;
  public createdAt?: string;
}

class DataTablesResponse {
  data: any[];
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
}
@Component({
  selector: 'view-credit',
  templateUrl: './view-credit.component.html',
})

export class ViewCreditComponent implements AfterViewInit, OnInit {
  public operatorDisable = false;
  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  addCreditForm: FormGroup;
  isSubmitted: boolean = false;
  driverData: any = {};
  driver_id: any;
  admindata: any;
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject(); @ViewChild(DataTableDirective)
  credits: Credit[] = [];
  searchForm: FormGroup;
  balance: number = 0;
  driverName: string;
  @ViewChild('closeBtn') closeBtn;
  profileImageUrl: any;
  @ViewChild('myPersistenceModal') myPersistenceModal;
  constructor(
    private creditService: CreditService,
    private authService: AuthService,
    private toastyService: ToastyService,
    private router: Router,
    private validation: Validation,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.admindata = JSON.parse(localStorage.getItem('adminData'));
    this.profileImageUrl = environment.profileImageUrl;
    this.route.params.subscribe(params => {
      this.driver_id = params.driver_id;
    });
    this.addCreditForm = new FormGroup({
      amount: new FormControl("", [Validators.required, Validators.minLength(1), Validators.maxLength(9), Validators.pattern(this.validation.integer)])
    })
    this.getDriverDetails();
    this.authService.clearDataTableData("DataTables_credit_management");
    this.loading = true;
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      serverSide: true,
      processing: false,
      order: [0, 'desc'],
      searching: false,
      stateSave: true,
      stateSaveCallback: function (settings, data) {
        localStorage.setItem(
          "DataTables_credit_management",
          JSON.stringify(data)
        );
      },
      stateLoadCallback: function (settings) {
        return JSON.parse(localStorage.getItem("DataTables_credit_management"));
      },
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters.search.value = dataTablesParameters.search.value.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
        dataTablesParameters.driverId = this.driver_id;
        this.creditService.listAllCredits(dataTablesParameters).subscribe(
          resp => {
            this.loading = false;
            this.credits = resp.data;
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
        { data: "amount" },
        { data: "type", orderable: false, searchable: false },
        { data: "first_name", orderable: false, searchable: false },
        { data: "createdAt", searchable: false }
      ]
    };
  }

  openModal() {
    this.isSubmitted = false;
    this.addCreditForm.reset();
    this.myPersistenceModal.show();
  }
  imgErrorHandler(event) {
    event.target.src = this.profileImageUrl + 'default.png';
  }
  getDriverDetails() {
    this.loading = true;
    let driverData = {
      'driver_id': this.driver_id
    }
    this.creditService.getDriverDetails(driverData).subscribe(
      respone => {
        this.loading = false;
        this.driverData = respone.data;
        this.driverName = this.driverData.name;
        this.balance = this.driverData.creditBalance;
      },
      error => {
        this.loading = false;
        this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
      }
    );
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

  onFormSubmit() {
    this.isSubmitted = true;
    if (this.addCreditForm.value.amount > 80000 && this.admindata.type == "operator") {
      this.operatorDisable = true;
    } else {
      this.operatorDisable = false;
      if (this.addCreditForm.valid) {
        this.loading = true;
        this.addCreditForm.value.driverId = this.driver_id;
        this.creditService.addCredit(this.addCreditForm.value)
          .subscribe(next => {
            this.loading = false;
            this.isSubmitted = false;
            if (next.status_code == 200) {
              this.addToast({ title: 'Success', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
              this.rerender();
              this.getDriverDetails();
              this.addCreditForm.reset();
              this.closeBtn.nativeElement.click();
            } else {
              this.addToast({ title: 'Error', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
            }
          },
            error => {
              this.loading = false;
              this.isSubmitted = false;
              this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
            })
      }
    }
  }

}

