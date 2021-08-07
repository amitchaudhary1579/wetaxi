import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NgxLoadingModule } from 'ngx-loading';
import { InputTrimModule } from 'ng2-trim-directive';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FileValidator } from '../helper/file-input.validator';
import { PassengerRoutingModule } from './passenger-routing.module';
import { ListPassengerComponent } from './list-passenger/list-passenger.component';
import { AddPassengerComponent } from './add-passenger/add-passenger.component';
import { ViewPassengerComponent } from './view-passenger/view-passenger.component';

@NgModule({
  imports: [
    CommonModule,
    PassengerRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgbDropdownModule,
    NgxLoadingModule.forRoot({}),
    InputTrimModule,
    NgbDatepickerModule
  ],
  declarations: [ListPassengerComponent, AddPassengerComponent, ViewPassengerComponent],
  providers: [ FileValidator ]

})

export class PassengerModule { }
