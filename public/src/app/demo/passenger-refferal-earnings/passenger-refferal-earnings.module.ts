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
import { PassengerRefferalEarningsRoutingModule } from './passenger-refferal-earnings-routing.module';
import { ListPassengerRefferalEarningsComponent } from './list-passenger-refferal-earnings/list-passenger-refferal-earnings.component';
import { ViewPassengerRefferalEarningsComponent } from './view-passenger-refferal-earnings/view-passenger-refferal-earnings.component';

@NgModule({
  imports: [
    CommonModule,
    PassengerRefferalEarningsRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgbDropdownModule,
    NgxLoadingModule.forRoot({}),
    InputTrimModule,
    NgbDatepickerModule
  ],
  declarations: [ListPassengerRefferalEarningsComponent, ViewPassengerRefferalEarningsComponent],
  providers: [ FileValidator ]

})

export class PassengerRefferalEarningsModule { }
