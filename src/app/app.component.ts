import { Component } from '@angular/core';
import {FireService} from "./fire.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  sendThisMessage: any;
  email: string = "";
  password: string = "";
  hide = true;

  constructor(public fireService: FireService) {

  };


  deleteMessageByID(id: any){
    this.fireService.deleteMessageByID(id);
  }

  toggleExpand(product: any) {
    product.expanded = !product.expanded;
  }

  uploadPDF($event: MouseEvent) {

  }
}
