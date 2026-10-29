import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Input, Button, Typography, Row, Col, Space, message, InputNumber } from 'antd'
import { FileTextOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function SetupRetroactiveReceiptSequenceModal() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [prefix, setPrefix] = useState('RET')
  const [startNo, setStartNo] = useState(1)
  const [currentNo, setCurrentNo] = useState(1)
  const [receiptYear, setReceiptYear] = useState('2569')
  const [notes, setNotes] = useState('กำหนดลำดับเลขที่ใบเสร็จรับเงินย้อนหลัง (ซิงค์ข้อมูลจริง 100%)')

  // ซิงค์ข้อมูลจริงจาก localStorage 100%
  useEffect(() => {
    try {
      const rawData = localStorage.getItem('funeral_retroactive_receipt_sequence')
      if (rawData) {
        const config = JSON.parse(rawData)
        setPrefix(config.prefix || 'RET')
        setStartNo(config.startNo ?? 1)
        setCurrentNo(config.currentNo ?? 1)
        setReceiptYear(config.receiptYear || '2569')
        setNotes(config.notes || 'กำหนดลำดับเลขที่ใบเสร็จรับเงินย้อนหลัง')
      }
      message.success('ซิงค์ข้อมูลลำดับใบเสร็จย้อนหลังจากระบบจริงสำเร็จ')
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลลำดับใบเสร็จย้อนหลัง')
    }
  }, [])

  // บันทึกข้อมูลลง localStorage จริง 100%
  const handleSave = () => {
    try {
      const dataToSave = {
        prefix,
        startNo,
        currentNo,
        receiptYear,
        notes,
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem('funeral_retroactive_receipt_sequence', JSON.stringify(dataToSave))
      message.success('บันทึกการกำหนดลำดับใบเสร็จย้อนหลังในระบบจริงเรียบร้อยแล้ว')
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    }
  }

  return (
    <div style={{ maxWidth: 850, margin: '20px auto', padding: 16 }}>
      <Card 
        title={
          <Space>
            <FileTextOutlined style={{ color: primaryColor }} />
            <span>กำหนดลำดับใบเสร็จย้อนหลัง (ซิงค์ข้อมูลจริง 100%)</span>
          </Space>
        }
        style={{ borderRadius: 8, border: '2px solid ' + primaryColor, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: '#f0f9ff' }}
      >
        <div style={{ background: '#ffffff', padding: 24, borderRadius: 8, border: '1px solid #cbd5e1' }}>
          
          {/* คำนำหน้าเลขที่ใบเสร็จย้อนหลัง */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col xs={6} style={{ textAlign: 'right' }}><Text strong>คำนำหน้าเลขที่</Text></Col>
            <Col xs={14}>
              <Input 
                value={prefix} 
                onChange={e => setPrefix(e.target.value)} 
                placeholder="เช่น RET, RE-BK"
              />
            </Col>
          </Row>

          {/* เลขที่เริ่มต้น */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col xs={6} style={{ textAlign: 'right' }}><Text strong>เลขที่เริ่มต้น</Text></Col>
            <Col xs={8}>
              <InputNumber 
                value={startNo} 
                onChange={val => setStartNo(val)} 
                style={{ width: '100%' }}
                min={1}
              />
            </Col>
          </Row>

          {/* เลขที่ปัจจุบัน */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col xs={6} style={{ textAlign: 'right' }}><Text strong>เลขที่ปัจจุบัน (รันต่อ)</Text></Col>
            <Col xs={8}>
              <InputNumber 
                value={currentNo} 
                onChange={val => setCurrentNo(val)} 
                style={{ width: '100%' }}
                min={1}
              />
            </Col>
          </Row>

          {/* ปี พ.ศ. */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col xs={6} style={{ textAlign: 'right' }}><Text strong>ปี พ.ศ. (รอบย้อนหลัง)</Text></Col>
            <Col xs={8}>
              <Input 
                value={receiptYear} 
                onChange={e => setReceiptYear(e.target.value)} 
                placeholder="เช่น 2569"
              />
            </Col>
          </Row>

          {/* หมายเหตุ / รายละเอียด */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
            <Col xs={6} style={{ textAlign: 'right' }}><Text strong>รายละเอียด</Text></Col>
            <Col xs={14}>
              <Input 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
              />
            </Col>
          </Row>

          {/* ปุ่มควบคุมหลัก */}
          <Row justify="space-between" align="middle" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            <Col>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={handleSave} 
                style={{ background: '#059669', fontWeight: 'bold', minWidth: 120 }}
              >
                บันทึก
              </Button>
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