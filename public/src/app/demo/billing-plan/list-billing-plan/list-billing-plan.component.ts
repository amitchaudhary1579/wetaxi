import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { BillingPlanService, AuthService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import Swal from 'sweetalert2';

class BiilingPlan {
  name: string;
  details: string;
  billingType: string;
  chargeAmt: string;
}

class DataTablesResponse {
  data: any[];
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
}

@Component({
  selector: 'list-billing-plan',
  templateUrl: './list-billing-plan.component.html'
})
export class ListBillingplanComponent implements AfterViewInit, OnInit { 

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  billingPlans: BiilingPlan[];
  public operatorDisable = false;
  
  constructor(
    private billingPlanService: BillingPlanService,
    private authService: AuthService,
    private toastyService: ToastyService
  ) { }

  ngOnInit() {
    let admindata = JSON.parse(localStorage.getItem('adminData'));
    if (admindata.type == "operator") {
      this.operatorDisable = true;
    } else {
      this.operatorDisable = false;
    }
    this.loading = true;
    this.authService.clearDataTableData("DataTables_billing_plan_management");
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      serverSide: true,
      processing: false,
      stateSave: true,
      stateSaveCallback: function(settings, data) {
        localStorage.setItem(
          "DataTables_billing_plan_management",
          JSON.stringify(data)
        );
      },
      stateLoadCallback: function(settings) {
        return JSON.parse(localStorage.getItem("DataTables_billing_plan_management"));
      },
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters.search.value = dataTablesParameters.search.value.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
        this.billingPlanService.listAllBillingPlans(dataTablesParameters).subscribe(
          resp => {
            this.loading = false;
            this.billingPlans = resp.data;
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: []
            });
          },
          error => {
            this.loading = false;
            this.addToast({title:'Error', msg:error.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
          }
        );
      },
      columns: [
        { data: "name" },
        { data: "details" },
        { data: "chargeAmt", searchable: false },
        { data: "billingType" },
        { data: "actions", orderable: false, searchable: false }
      ]
    };
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

  operatorPermission() {
    Swal({
      title: 'Alert',
      text: 'You do not have a permission edit info',
      type: 'info',
      showCloseButton: true,
      showCancelButton: false
    }).then((willDelete) => {
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

}
