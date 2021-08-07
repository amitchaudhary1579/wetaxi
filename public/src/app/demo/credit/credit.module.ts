import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NgxLoadingModule } from 'ngx-loading';
import { InputTrimModule } from 'ng2-trim-directive';
import { CreditRoutingModule } from './credit-routing.module';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { SelectModule } from 'ng-select';
import { ListCreditComponent } from './list-credit/list-credit.component';
import { ViewCreditComponent } from './view-credit/view-credit.component';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  imports: [
    CommonModule,
    CreditRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgbDropdownModule,
    NgxLoadingModule.forRoot({}),
    InputTrimModule,
    SelectModule,
    NgbDatepickerModule
  ],
  declarations: [ListCreditComponent, ViewCreditComponent]
})

export class CreditModule { }
