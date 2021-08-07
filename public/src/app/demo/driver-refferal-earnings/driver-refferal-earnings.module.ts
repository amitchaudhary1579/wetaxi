import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NgxLoadingModule } from 'ngx-loading';
import { InputTrimModule } from 'ng2-trim-directive';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { FileValidator } from '../helper/file-input.validator';
import { SelectModule } from 'ng-select';
import { DriverRefferalEarningRoutingModule } from './driver-refferal-routing.module';
import { ListDriverRefferalEarningsComponent } from './list-driver-refferal-earnings/list-driver-refferal-earnings.component';
import { ViewDriverRefferalEarningsComponent } from './view-driver-refferal-earnings/view-driver-refferal-earnings.component';

@NgModule({
  imports: [
    CommonModule,
    DriverRefferalEarningRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgbDropdownModule,
    NgxLoadingModule,
    InputTrimModule,
    NgbDatepickerModule,
    SelectModule
  ],
  declarations: [ ListDriverRefferalEarningsComponent, ViewDriverRefferalEarningsComponent],
  providers: [ FileValidator ]
})

export class DriverRefferalEarningModule { }
