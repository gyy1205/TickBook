// 画布坐标系：宽高均为 0%~100%，以左上角为原点
// X 取横向区间中点，Y 取纵向区间中点
// align 决定锚点：left=左边界, right=右边界, center=居中

export interface FieldConfig {
  x: number; y: number;        // 百分比锚点
  size: number;                 // cqw 字号
  color: string;
  align: 'left' | 'center' | 'right';
  underline?: boolean;
  bold?: boolean;
  fontFamily?: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  image: string;
  aspectRatio: string;
  fields: {
    // 1. 票号 (0-32%, 3-12%) 左上红字
    serial_number: FieldConfig;
    // 2. 检票口 (64-97%, 3-12%) 右上
    gate_info: FieldConfig;
    // 3. 出发站名 (8-34%, 14-26%)
    departure_station: FieldConfig;
    // 4. 出发站英文 (8-34%, 27-31%)
    departure_station_en: FieldConfig;
    // 5. 车次 (38-60%, 15-27%) 居中最大字，下划线
    train_number: FieldConfig;
    // 6. 到达站名 (66-92%, 14-26%)
    arrival_station: FieldConfig;
    // 7. 到达站英文 (66-92%, 27-31%)
    arrival_station_en: FieldConfig;
    // 8. 发车时间 (5-48%, 33-41%)
    departure_info: FieldConfig;
    // 9. 票价 (发车时间左侧，同纵向37%)
    price: FieldConfig;
    // 10. 学生票标识 (票价与发车时间之间) — 当前无数据源，仅占位
    student_mark: FieldConfig;
    // 11. 车厢座位号 (68-94%, 33-41%)
    carriage_info: FieldConfig;
    // 12. 座位等级 (68-94%, 42-49%)
    seat_class: FieldConfig;
    // 13. 票务备注1 (5-30%, 51-58%)
    notes_line1: FieldConfig;
    // 14. 票务备注2 (5-30%, 60-67%)
    notes_line2: FieldConfig;
    // 15-16. 乘车人信息 (5-60%, 69-77%) 身份证号+姓名同行
    passenger_full: FieldConfig;
    // 17. 底部服务提示 (7-66%, 79-92%)
    service_text: FieldConfig;
    // 18. 二维码 (72-96%, 64-94%) — 空白模板已含
    qr_code: FieldConfig;
  };
}

// —— 磁票类 6772×4271 ——
const mag: TemplateConfig['fields'] = {
  serial_number:       { x: 8,   y: 9.5,  size: 4.3, color: '#cc0000', align: 'left', bold: true },
  gate_info:           { x: 90,  y: 9.5,  size: 4, color: '#333',    align: 'right', bold: true },
  departure_station:   { x: 12,  y: 20,   size: 5.5, color: '#111',    align: 'left', bold: true },
  departure_station_en:{ x: 14,  y: 29,   size: 4, color: '#111',    align: 'left', fontFamily: "'Times New Roman',serif" },
  train_number:        { x: 49,  y: 21,   size: 6.0, color: '#1a1a1a', align: 'center', fontFamily: "'Times New Roman',serif" },
  arrival_station:     { x: 88,  y: 20,   size: 5.5, color: '#111',    align: 'right', bold: true },
  arrival_station_en:  { x: 84,  y: 29,   size: 4, color: '#111',    align: 'right', fontFamily: "'Times New Roman',serif" },
  departure_info:      { x: 10,  y: 37,   size: 4, color: '#222',    align: 'left', bold: true },
  price:               { x: 10,  y: 45,   size: 4, color: '#111',    align: 'left', bold: true },
  student_mark:        { x: 20,  y: 45,   size: 2.5, color: '#cc0000', align: 'center' },
  carriage_info:       { x: 86,  y: 37,   size: 4, color: '#222',    align: 'right', bold: true },
  seat_class:          { x: 86,  y: 45.5, size: 4, color: '#555',    align: 'right', bold: true },
  notes_line1:         { x: 10, y: 54.5, size: 4, color: '#555',    align: 'left', bold: true },
  notes_line2:         { x: 10, y: 63.5, size: 4, color: '#555',    align: 'left', bold: true },
  passenger_full:      { x: 10, y: 72,   size: 4, color: '#111',    align: 'left', bold: true },
  service_text:        { x: 36.5,y: 85.5, size: 1.8, color: '#444',    align: 'center' },
  qr_code:             { x: 84,  y: 79,   size: 1.2, color: '#999',    align: 'center' },
};

// —— 软纸票类 6792×4500 ——
// 坐标体系一致，仅微调
const soft: TemplateConfig['fields'] = {
  serial_number:       { x: 8,   y: 9.5,  size: 4.3, color: '#cc0000', align: 'left', bold: true },
  gate_info:           { x: 90,  y: 9.5,  size: 4, color: '#333',    align: 'right', bold: true },
  departure_station:   { x: 12,  y: 20,   size: 5.5, color: '#111',    align: 'left', bold: true },
  departure_station_en:{ x: 14,  y: 29,   size: 4, color: '#111',    align: 'left', fontFamily: "'Times New Roman',serif" },
  train_number:        { x: 49,  y: 21,   size: 6.0, color: '#1a1a1a', align: 'center', fontFamily: "'Times New Roman',serif" },
  arrival_station:     { x: 88,  y: 20,   size: 5.5, color: '#111',    align: 'right', bold: true },
  arrival_station_en:  { x: 84,  y: 29,   size: 4, color: '#111',    align: 'right', fontFamily: "'Times New Roman',serif" },
  departure_info:      { x: 10,  y: 37,   size: 4, color: '#222',    align: 'left', bold: true },
  price:               { x: 10,  y: 45,   size: 4, color: '#111',    align: 'left', bold: true },
  student_mark:        { x: 20,  y: 45,   size: 2.5, color: '#cc0000', align: 'center' },
  carriage_info:       { x: 86,  y: 37,   size: 4, color: '#222',    align: 'right', bold: true },
  seat_class:          { x: 86,  y: 45.5, size: 4, color: '#555',    align: 'right', bold: true },
  notes_line1:         { x: 10, y: 54.5, size: 4, color: '#555',    align: 'left', bold: true },
  notes_line2:         { x: 10, y: 63.5, size: 4, color: '#555',    align: 'left', bold: true },
  passenger_full:      { x: 10, y: 72,   size: 4, color: '#111',    align: 'left', bold: true },
  service_text:        { x: 36.5,y: 85.5, size: 1.8, color: '#444',    align: 'center' },
  qr_code:             { x: 84,  y: 79,   size: 1.2, color: '#999',    align: 'center' },
};

export const TEMPLATES: TemplateConfig[] = [
  { id: 'none',       name: '默认样式',   image: '',                        aspectRatio: '6772 / 4271', fields: mag },
  { id: 'blue_mag',   name: '蓝色磁票',   image: '/templates/蓝色磁票.png',   aspectRatio: '6772 / 4271', fields: mag },
  { id: 'red_mag',    name: '红色磁票',   image: '/templates/红色磁票.png',   aspectRatio: '6772 / 4271', fields: mag },
  { id: 'gs_red_mag', name: '广深红磁票', image: '/templates/广深红磁票.png', aspectRatio: '6772 / 4271', fields: mag },
  { id: 'red_soft',   name: '红色软纸票', image: '/templates/红色软纸票.png',  aspectRatio: '6792 / 4500', fields: soft },
  { id: 'blue_soft',  name: '蓝色软纸票', image: '/templates/蓝色软纸票.png',  aspectRatio: '6792 / 4500', fields: soft },
  { id: 'gs_red',     name: '广深红票',   image: '/templates/广深红票.png',   aspectRatio: '6792 / 4500', fields: soft },
];

export function getTemplate(id: string): TemplateConfig {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}
