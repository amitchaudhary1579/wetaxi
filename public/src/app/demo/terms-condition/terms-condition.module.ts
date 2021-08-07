import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { ToastyModule } from 'ng2-toasty';
import { InputTrimModule } from 'ng2-trim-directive';
import { NgxLoadingModule } from 'ngx-loading';
import { TermsConditionRoutingModule } from './terms-condition-routing.module';
import { TermsConditionComponent } from './terms-condition.component';
import { CustomFormsModule } from 'ng2-validation';

@NgModule({
  imports: [
    ReactiveFormsModule,
    CommonModule,
    SharedModule,
    ToastyModule,
    InputTrimModule,
    NgxLoadingModule.forRoot({}),
    CustomFormsModule,
    TermsConditionRoutingModule
  ],
  declarations: [TermsConditionComponent]
})
export class TermsConditionModule { }
