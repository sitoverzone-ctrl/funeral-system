import { Card, Row, Col, Statistic } from 'antd'

// ตัวเลขสมมติ ภายหลังดึงจากเครื่องแม่
const stats = [
  { title: 'สมาชิกได้รับสิทธิ', value: 1000 },
  { title: 'ขาดสิทธิ (ปีนี้)', value: 10 },
  { title: 'ตาย (ปีนี้)', value: 12 },
  { title: 'ลาออก (ปีนี้)', value: 1 },
  { title: 'ให้ออก (ปีนี้)', value: 2 },
  { title: 'ตาย (สะสม)', value: 100 },
  { title: 'ขาดสิทธิ (สะสม)', value: 50 },
  { title: 'สมาชิกใหม่', value: 6 },
]

export default function Dashboard() {
  return (
    <Row gutter={[16, 16]}>
      {stats.map((s) => (
        <Col key={s.title} xs={12} md={6}>
          <Card>
            <Statistic title={s.title} value={s.value} suffix="ราย" />
          </Card>
        </Col>
      ))}
    </Row>
  )
}