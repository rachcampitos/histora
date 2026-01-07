import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-chart-card6',
  standalone: true,
  imports: [NgApexchartsModule, MatCardModule, CommonModule],
  templateUrl: './chart-card6.component.html',
  styleUrl: './chart-card6.component.scss',
})
export class ChartCard6Component implements OnInit {
  @Input() cardTitle: string = '';
  @Input() cardValue: number | string = '';
  @Input() icon: string = ''; // material icon name, e.g. 'face'
  @Input() iconBg: string = '#6F42C1'; // default purple
  @Input() chartOptions: any; // ApexChart config passed from parent

  cardBackgroundColor: string = '';

  ngOnInit() {
    this.cardBackgroundColor = this.hexToRgba(this.iconBg, 0.15);
  }

  private hexToRgba(hex: string, alpha: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16); // Red
      const g = parseInt(result[2], 16); // Green
      const b = parseInt(result[3], 16); // Blue
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgba(111, 66, 193, ${alpha})`;
  }
}
