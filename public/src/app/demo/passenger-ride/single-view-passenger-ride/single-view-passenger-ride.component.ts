import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import {DriverRideService } from '../../services/driver-ride.service';


@Component({
  selector: 'app-single-view-passenger-ride',
  templateUrl: './single-view-passenger-ride.component.html'
})
export class SingleViewPassengerRideComponent implements OnInit {
  public ride_id:any;
  public get_ride_information:any;
  profileImageUrl: any;
  get_passanger_id: any;
  
    constructor(
      private route: ActivatedRoute,
      private driverRewardService: DriverRideService
      
    ) { }
  
    ngOnInit() {
      this.profileImageUrl = environment.profileImageUrl;
      this.route.params.subscribe(params => {
        this.ride_id = params.passenger_id;
      });
      this.route.queryParams.subscribe(queryParams => {
        this.get_passanger_id = queryParams.PassengerId;
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
