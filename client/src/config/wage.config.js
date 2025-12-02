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
};

export default wageConfig;
