import { Component, Output } from '@angular/core';

@Component({
    selector: 'ct-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})
export class NavbarComponent { 
    @Output() isIn = false;   // store state
    toggleState() { // click handler
        let bool = this.isIn;
        this.isIn = bool === false; 
    }
}