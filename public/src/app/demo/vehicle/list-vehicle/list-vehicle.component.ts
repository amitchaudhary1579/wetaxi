import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { VehicleService, AuthService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

class Vehicle {
  Id: number;
  first_name: string;
  last_name: string;
}

class DataTablesResponse {
  data: any[];
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
}

@Component({
  selector: 'list-vehicle',
  templateUrl: './list-vehicle.component.html'
})
export class ListVehicleComponent implements AfterViewInit, OnInit { 

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  vehicles: Vehicle[];
  vehicleTypeImageUrl: any;
  
  constructor(
    private vehicleService: VehicleService,
    private authService: AuthService,
    private toastyService: ToastyService
  ) { }

  ngOnInit() {
    this.vehicleTypeImageUrl = environment.vehicleTypeImageUrl;
    this.authService.clearDataTableData("DataTables_vehicle_management");
    this.loading = true;
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      serverSide: true,
      processing: false,
      stateSave: true,
      stateSaveCallback: function(settings, data) {
        localStorage.setItem(
          "DataTables_vehicle_management",
          JSON.stringify(data)
        );
      },
      stateLoadCallback: function(settings) {
        return JSON.parse(localStorage.getItem("DataTables_vehicle_management"));
      },
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters.search.value = dataTablesParameters.search.value.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
        this.vehicleService.ListOfAllVehicles(dataTablesParameters).subscribe(
          resp => {
            this.loading = false;
            this.vehicles = resp.data;
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
        { data: "autoIncrementID" },
        { data: "type" },
        { data: "minFare", searchable: false },
        { data: "feePerKM", searchable: false },
        { data: "image", orderable: false, searchable: false },
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

  // activeInactiveVehicle(vehicle: any) {
  //   let text;
  //   if(vehicle.isActive) {
  //     text = 'You want to inactive this vehicle ?';
  //   } else {
  //     text = 'You want to active this vehicle ?';
  //   }

  //   Swal({
  //     title: 'Are you sure?',
  //     text: text,
  //     type: 'warning',
  //     showCloseButton: true,
  //     showCancelButton: true
  //   }).then((willDelete) => {
  //       if (willDelete && !willDelete.dismiss) {
  //         let data = {
  //           'vehicle_id': vehicle._id
  //         }
  //         this.vehicleService.activeInactiveVehicle(data).subscribe(
  //           next => {
  //            if(next.status_code == 200) {
  //              this.rerender();
  //              if(vehicle.isActive) {
  //               Swal('Success', "Vehicle inactivated successfully.", 'success');
  //             } else {
  //               Swal('Success', "Vehicle activated successfully.", 'success');
  //             }
  //            } else {
  //             Swal('Error', "Vehicle status is not updated.", 'error');
  //            }
  //           },
  //           error => {
  //             Swal('Error', "Vehicle status is not updated.", 'error');
  //           }
  //         );
  //       } else {
          
  //       }
  //     });
  // }

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

