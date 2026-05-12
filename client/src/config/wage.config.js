/**
 * 工资计算配置
 * Wage Calculation Configuration
 * 
 * 修改这些值无需重新编译，仅需重启开发服务器或重新部署
 */

const wageConfig = {
  // 基础时薪 ($/小时)
  baseHourlyRate: 8.5,
  
  // 每单油费补贴 ($)
  fuelPerOrder: 3.5,
  
  // 长单距离阈值 (公里)
  longTripThresholdKm: 10,
  
  // 长单额外油费补贴 ($)
  longTripExtraFuel: 3.5,
  
  // 双周结算周期 (天数)
  biweeklySettlementDays: 14,

  // 双周周期锚点日期 (任一已知周期的开始日)
  // 例如 '2026-04-20' 表示 4/20–5/3 是一个周期，之后每 14 天向前/向后递推
  biweeklyAnchorDate: '2026-04-20',
};

export default wageConfig;
