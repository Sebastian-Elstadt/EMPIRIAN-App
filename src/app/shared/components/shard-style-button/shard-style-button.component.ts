import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-shard-style-button',
  templateUrl: './shard-style-button.component.html',
  styleUrls: ['./shard-style-button.component.scss'],
  standalone: true
})
export class ShardStyleButtonComponent {
  @Input() public disabled = false;
}