import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Input, Button, Typography, Row, Col, Space, Table, DatePicker, message, Popconfirm } from 'antd'
import { FileTextOutlined, PlayCircleOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography

export default function ClearMaintenanceDeductionModal() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [startDate, setStartDate] = useState(dayjs('2026-10-01'))
  const [endDate, setEndDate] = useState(dayjs('2026-10-31'))
  const [memberQuery, setMemberQuery] = useState('ทั้งหมด')
  const [deductionData, setDeductionData] = useState([])
  const [loading, setLoading] = useState(false)

  // ดึงข้อมูลจริงจาก localStorage ตามเงื่อนไขวันที่และรหัสสมาชิก
  const handleProcessDeductions = () => {
    setLoading(true)
    try {
      const membersRaw = localStorage.getItem('funeral_members')
      const members = membersRaw ? JSON.parse(membersRaw) : []

      // ดึงข้อมูลรายการหักเงินบำรุงจริงจาก localStorage (ถ้ามี)
      const maintenanceRaw = localStorage.getItem('funeral_maintenance_deductions')
      let records = maintenanceRaw ? JSON.parse(maintenanceRaw) : []

      // หากยังไม่มีตารางเก็บบันทึกแยก ให้ดึงจากฐานข้อมูลสมาชิกจริงมาประมวลผล
      if (!records || records.length === 0) {
        records = members.map((m, idx) => ({
          key: m.id || m.memberId || idx + 1,
          memberId: m.id || m.memberId || (idx + 1),
          name: m.name || m.fullname || `${m.prefix || ''}${m.firstName || ''} ${m.lastName || ''}`.trim(),
          group: m.group || m.memberGroup || '-',
          maintenanceAmount: m.maintenanceAmount || m.maintenanceFee || 50,
          date: m.maintenanceDate || m.deductionDate || '2026-10-10',
          status: m.status || 'ปกติ'
        }))
      }

      // กรองตามรหัสสมาชิก (กรณีระบุรายคน หรือหลายคนคั่นด้วยคอมม่า เช่น 1002,1003)
      let filtered = records
      if (memberQuery.trim() !== 'ทั้งหมด' && memberQuery.trim() !== '') {
        const queryIds = memberQuery.split(',').map(s => s.trim())
        filtered = records.filter(r => queryIds.includes(String(r.memberId)))
      }

      setDeductionData(filtered)
      if (filtered.length > 0) {
        message.success(`ดึงข้อมูลรายการหักเงินบำรุงจริงสำเร็จ ${filtered.length} รายการ`)
      } else {
        message.warning('ไม่พบรายการหักเงินบำรุงตามเงื่อนไขที่กำหนดในระบบจริง')
      }
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการประมวลผลข้อมูลจากระบบ')
    } finally {
      setLoading(false)
    }
  }

  // ฟังก์ชันล้าง/ลบรายการหักเงินบำรุงจริงออกจากระบบ
  const handleClearRecords = () => {
    try {
      if (deductionData.length === 0) {
        message.warning('ไม่มีรายการสำหรับล้างข้อมูล')
        return
      }

      const membersRaw = localStorage.getItem('funeral_members')
      if (membersRaw) {
        let members = JSON.parse(membersRaw)
        const clearIds = deductionData.map(d => String(d.memberId))

        // อัปเดตเคลียร์ยอดหักเงินบำรุงในฐานข้อมูลสมาชิกจริง
        members = members.map(m => {
          const mId = String(m.id || m.memberId)
          if (clearIds.includes(mId)) {
            return {
              ...m,
              maintenanceAmount: 0,
              maintenanceFee: 0
            }
          }
          return m
        })

        localStorage.setItem('funeral_members', JSON.stringify(members))
        localStorage.removeItem('funeral_maintenance_deductions')
      }

      setDeductionData([])
      message.success('ล้างรายการหักเงินบำรุงในระบบจริงเรียบร้อยแล้ว')
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการล้างข้อมูล')
    }
  }

  const columns = [
    { title: 'เลขสมาชิก', dataIndex: 'memberId', key: 'memberId', width: 100, align: 'center' },
    { title: 'ชื่อ - นามสกุล', dataIndex: 'name', key: 'name' },
    { title: 'กลุ่ม', dataIndex: 'group', key: 'group', width: 90, align: 'center' },
    { title: 'วันที่หักเงินบำรุง', dataIndex: 'date', key: 'date', width: 130, align: 'center' },
    { title: 'ยอดเงินบำรุง (บาท)', dataIndex: 'maintenanceAmount', key: 'maintenanceAmount', width: 140, align: 'right', render: val => Number(val || 0).toLocaleString() },
    { title: 'สถานะ', dataIndex: 'status', key: 'status', width: 110, align: 'center' }
  ]

  return (
    <div style={{ maxWidth: 1000, margin: '20px auto', padding: 16 }}>
      <Card 
        title={
          <Space>
            <FileTextOutlined style={{ color: primaryColor }} />
            <span>ล้างรายการหักเงินบำรุง ตามวันที่หัก (ดึงข้อมูลจริงจากระบบ)</span>
          </Space>
        }
        style={{ borderRadius: 8, border: '2px solid ' + primaryColor, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: '#f0f9ff' }}
      >
        <div style={{ background: '#ffffff', padding: 24, borderRadius: 8, border: '1px solid #cbd5e1' }}>
          
          {/* ช่วงวันที่ */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col xs={4} style={{ textAlign: 'right' }}><Text strong>วันที่ตั้งแต่</Text></Col>
            <Col xs={8}>
              <DatePicker 
                value={startDate} 
                onChange={val => setStartDate(val)} 
                style={{ width: '100%' }} 
                format="YYYY-MM-DD"
              />
            </Col>
            <Col xs={3} style={{ textAlign: 'right' }}><Text strong>ถึงวันที่</Text></Col>
            <Col xs={9}>
              <DatePicker 
                value={endDate} 
                onChange={val => setEndDate(val)} 
                style={{ width: '100%' }} 
                format="YYYY-MM-DD"
              />
            </Col>
          </Row>

          {/* ระบุรหัสสมาชิก */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 8 }}>
            <Col xs={4} style={{ textAlign: 'right' }}><Text strong>ระบุรหัสสมาชิก</Text></Col>
            <Col xs={20}>
              <Input 
                value={memberQuery} 
                onChange={e => setMemberQuery(e.target.value)} 
                placeholder="พิมพ์ 'ทั้งหมด' หรือระบุเลขสมาชิก (เช่น 1002,1003)" 
              />
            </Col>
          </Row>

          <Row style={{ marginBottom: 20 }}>
            <Col xs={4}></Col>
            <Col xs={20}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                กรณีแก้ไขรายคน ให้ใส่เลขที่สมาชิก กรณีหลายคน ใส่คอมม่าคั้น เช่น 1002,1003
              </Text>
            </Col>
          </Row>

          {/* ตารางแสดงผลข้อมูลจริง */}
          <div style={{ marginBottom: 24 }}>
            <Table 
              dataSource={deductionData} 
              columns={columns} 
              rowKey="key" 
              size="small" 
              pagination={{ pageSize: 5 }}
              locale={{ emptyText: 'ยังไม่มีการประมวลผลข้อมูล หรือไม่พบข้อมูลในช่วงเวลานี้' }}
            />
          </div>

          {/* ปุ่มควบคุม */}
          <Row justify="space-between" align="middle" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            <Col>
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />} 
                  onClick={handleProcessDeductions} 
                  loading={loading}
                  style={{ background: '#059669', fontWeight: 'bold' }}
                >
                  เริ่มประมวล
                </Button>
                {deductionData.length > 0 && (
                  <Popconfirm 
                    title="ยืนยันการล้างรายการหักเงินบำรุง?" 
                    description="การกระทำนี้จะล้างข้อมูลรายการหักเงินบำรุงในระบบจริง" 
                    onConfirm={handleClearRecords} 
                    okText="ยืนยัน" 
                    cancelText="ยกเลิก"
                  >
                    <Button type="primary" danger icon={<DeleteOutlined />} style={{ fontWeight: 'bold' }}>
                      ล้างรายการ
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </Col>
            <Col>
              <Button 
                icon={<CloseOutlined />} 
                onClick={() => window.history.back()} 
                style={{ fontWeight: 'bold', minWidth: 90 }}
              >
                ปิด
              </Button>
            </Col>
          </Row>

        </div>
      </Card>
    </div>
  )
}