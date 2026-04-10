import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardService } from '../../core/services/dashboard.service';
import {
  DashboardOverview,
  CrawlMetrics,
  SummaryMetrics,
  SourceHealthEntry
} from '../../models/api.models';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexStroke,
  ApexDataLabels,
  ApexTooltip,
  ApexFill,
  ApexLegend
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  fill: ApexFill;
  legend: ApexLegend;
  colors: string[];
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="page-container py-6">
      <div class="page-header">
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-500 mt-1">Báo cáo tổng quan hệ thống crawl tin tức</p>
      </div>

      <!-- Overview cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <div class="text-3xl font-bold text-blue-600">
            {{ overview ? (overview.totalArticles | number) : '–' }}
          </div>
          <div class="text-sm text-gray-500 mt-1">Tổng bài viết</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <div class="text-3xl font-bold text-green-600">
            {{ overview?.totalSources ?? '–' }}
          </div>
          <div class="text-sm text-gray-500 mt-1">Nguồn báo</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <div class="text-3xl font-bold text-purple-600">
            {{ overview ? (overview.totalSummaries | number) : '–' }}
          </div>
          <div class="text-sm text-gray-500 mt-1">AI tóm tắt</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <div class="text-3xl font-bold text-orange-600">
            {{ overview ? (overview.todayArticles ?? 0 | number) : '–' }}
          </div>
          <div class="text-sm text-gray-500 mt-1">Bài hôm nay</div>
        </div>
      </div>

      <!-- Chart + Source health -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        <!-- Crawl daily stats chart -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h2 class="font-semibold text-gray-900 mb-4">Thống kê crawl 7 ngày gần nhất</h2>
          <div *ngIf="crawlLoading" class="skeleton h-48 w-full rounded-lg"></div>
          <apx-chart
            *ngIf="!crawlLoading && chartOptions"
            [series]="chartOptions.series"
            [chart]="chartOptions.chart"
            [xaxis]="chartOptions.xaxis"
            [stroke]="chartOptions.stroke"
            [dataLabels]="chartOptions.dataLabels"
            [tooltip]="chartOptions.tooltip"
            [fill]="chartOptions.fill"
            [legend]="chartOptions.legend"
            [colors]="chartOptions.colors">
          </apx-chart>
        </div>

        <!-- Source health table -->
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <h2 class="font-semibold text-gray-900 mb-4">Tình trạng nguồn báo</h2>
          <div *ngIf="healthLoading" class="flex flex-col gap-2">
            <div *ngFor="let i of [1,2,3,4,5]" class="skeleton h-8 w-full rounded"></div>
          </div>
          <div *ngIf="!healthLoading" class="flex flex-col gap-3">
            <div *ngFor="let s of sourceHealth"
                 class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full flex-shrink-0"
                      [class]="s.isActive && !s.isFailing ? 'bg-green-500' : 'bg-red-400'"></span>
                <span class="text-sm text-gray-800">{{ s.sourceName }}</span>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-500">
                  {{ s.lastCrawledAt | date:'dd/MM HH:mm' }}
                </div>
                <div *ngIf="s.consecutiveFailCount > 0"
                     class="text-xs text-red-500">
                  {{ s.consecutiveFailCount }} lỗi liên tiếp
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary metrics -->
      <div class="bg-white rounded-xl border border-gray-100 p-5 mt-6">
        <h2 class="font-semibold text-gray-900 mb-4">AI Summary</h2>
        <div *ngIf="summaryLoading" class="skeleton h-12 w-full rounded"></div>
        <div *ngIf="!summaryLoading && summaryMetrics"
             class="flex flex-wrap gap-6">
          <div>
            <div class="text-2xl font-bold text-purple-600">
              {{ summaryMetrics.totalSummarized | number }}
            </div>
            <div class="text-sm text-gray-500">Đã tóm tắt</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-orange-500">
              {{ (summaryMetrics.pendingJobs ?? 0) | number }}
            </div>
            <div class="text-sm text-gray-500">Đang chờ xử lý</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-green-600">
              {{ summaryMetrics.successRate | number:'1.0-1' }}%
            </div>
            <div class="text-sm text-gray-500">Tỷ lệ thành công</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-700">
              {{ summaryMetrics.avgLatencyMs != null ? (summaryMetrics.avgLatencyMs | number:'1.0-0') : '–' }} ms
            </div>
            <div class="text-sm text-gray-500">Thời gian trung bình</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  overview: DashboardOverview | null = null;
  sourceHealth: SourceHealthEntry[] = [];
  summaryMetrics: SummaryMetrics | null = null;
  chartOptions: ChartOptions | null = null;

  crawlLoading = true;
  healthLoading = true;
  summaryLoading = true;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getOverview().subscribe({
      next: (d) => this.overview = d,
      error: () => {}
    });

    this.dashboardService.getCrawlMetrics().subscribe({
      next: (metrics: CrawlMetrics) => {
        this.buildChart(metrics);
        this.crawlLoading = false;
      },
      error: () => { this.crawlLoading = false; }
    });

    this.dashboardService.getSourceHealth().subscribe({
      next: (health) => {
        this.sourceHealth = health;
        this.healthLoading = false;
      },
      error: () => { this.healthLoading = false; }
    });

    this.dashboardService.getSummaryMetrics().subscribe({
      next: (m) => {
        this.summaryMetrics = m;
        this.summaryLoading = false;
      },
      error: () => { this.summaryLoading = false; }
    });
  }

  private buildChart(metrics: CrawlMetrics): void {
    const labels = metrics.daily?.map((d: any) => d.date) ?? [];
    const total = metrics.daily?.map((d: any) => d.total ?? 0) ?? [];
    const newArticles = metrics.daily?.map((d: any) => d.newArticles ?? 0) ?? [];

    this.chartOptions = {
      series: [
        { name: 'Tổng bài crawl', data: total },
        { name: 'Bài mới', data: newArticles }
      ],
      chart: { type: 'area', height: 220, toolbar: { show: false }, fontFamily: 'inherit' },
      xaxis: { categories: labels, labels: { style: { fontSize: '11px' } } },
      stroke: { curve: 'smooth', width: 2 },
      dataLabels: { enabled: false },
      tooltip: { x: { format: 'dd/MM' } },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.0 } },
      legend: { position: 'top' },
      colors: ['#3B82F6', '#10B981']
    };
  }
}
