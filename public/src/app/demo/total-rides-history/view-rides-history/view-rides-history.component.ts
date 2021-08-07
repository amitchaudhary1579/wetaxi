import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import {DriverRideService } from '../../services/driver-ride.service';

@Component({
  selector: 'app-view-rides-history',
  templateUrl: './view-rides-history.component.html'
})
export class ViewRidesHistoryComponent implements OnInit {
  public ride_id:any;
  public get_ride_information:any;
  profileImageUrl: any;
  
    constructor(
      private route: ActivatedRoute,
      private driverRewardService: DriverRideService
    ) { }
  
    ngOnInit() {
      this.profileImageUrl = environment.profileImageUrl;
      this.route.params.subscribe(params => {
        this.ride_id = params.driver_id;
      });
      this.getDriverDetails();
    }
    getDriverDetails() {
      let driverData = {
        'ride_id': this.ride_id
      }
        this.driverRewardService.SingleListOfAllDriversRide(driverData).subscribe(
        respone => {
          this.get_ride_information = respone.data;
        },
        error => {
          console.log('error: ', error);
        }
      );
    }
}
