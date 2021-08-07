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
import { DriverRoutingModule } from './driver-routing.module';
import { ListDriverComponent } from './list-driver/list-driver.component';
import { AddDriverComponent } from './add-driver/add-driver.component';
import { ViewDriverComponent } from './view-driver/view-driver.component';

@NgModule({
  imports: [
    CommonModule,
    DriverRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgbDropdownModule,
    NgxLoadingModule,
    InputTrimModule,
    NgbDatepickerModule,
    SelectModule
  ],
  declarations: [ ListDriverComponent,AddDriverComponent,ViewDriverComponent ],
  providers: [ FileValidator ]
})

export class DriverModule { }
