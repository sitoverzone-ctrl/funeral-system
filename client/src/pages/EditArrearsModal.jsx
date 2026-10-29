import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Input, Button, Typography, Row, Col, Space, message } from 'antd'
import { SearchOutlined, SaveOutlined, CloseOutlined, UndoOutlined, FileTextOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function EditArrearsModal() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [memberIdQuery, setMemberIdQuery] = useState('')
  const [currentMember, setCurrentMember] = useState(null)
  const [newArrears, setNewArrears] = useState('0')

  // ดึงข้อมูลจริงจาก localStorage แบบ 100% ตามรหัสสมาชิกที่กรอก
  const handleSearchMember = (searchKey) => {
    try {
      const query = searchKey !== undefined ? searchKey : memberIdQuery
      if (!query.trim()) {
        message.warning('กรุณากรอกเลขสมาชิกที่ต้องการค้นหา')
        return
      }

      const rawData = localStorage.getItem('funeral_members')
      if (!rawData) {
        message.error('ไม่พบฐานข้อมูลสมาชิกในระบบ (funeral_members)')
        return
      }

      const members = JSON.parse(rawData)
      // ค้นหาจากรหัสสมาชิกจริงในฐานข้อมูล
      const found = members.find(m => String(m.id || m.memberId || '').trim() === String(query).trim())

      if (found) {
        setCurrentMember(found)
        const arrearsVal = found.arrears ?? found.prevArrears ?? 0
        setNewArrears(String(arrearsVal))
        message.success(`ดึงข้อมูลสมาชิก ${found.name || found.fullname || ''} สำเร็จ`)
      } else {
        setCurrentMember(null)
        setNewArrears('0')
        message.warning(`ไม่พบสมาชิกเลขที่ "${query}" ในฐานข้อมูลจริง`)
      }
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการอ่านข้อมูลจากระบบ')
    }
  }

  // บันทึกข้อมูลจริงกลับลง localStorage
  const handleSaveArrears = () => {
    if (!currentMember) {
      message.warning('ไม่มีข้อมูลสมาชิกสำหรับบันทึก')
      return
    }

    try {
      const rawData = localStorage.getItem('funeral_members')
      if (!rawData) return

      let members = JSON.parse(rawData)
      const targetId = String(currentMember.id || currentMember.memberId)

      members = members.map(m => {
        const mId = String(m.id || m.memberId)
        if (mId === targetId) {
          return {
            ...m,
            arrears: Number(newArrears) || 0,
            prevArrears: Number(newArrears) || 0
          }
        }
        return m
      })

      localStorage.setItem('funeral_members', JSON.stringify(members))
      message.success('บันทึกยอดค้างชำระลงฐานข้อมูลจริงเรียบร้อยแล้ว')
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    }
  }

  // แสดงที่อยู่จริงจากข้อมูลสมาชิกครบถ้วน
  const renderFullAddress = (m) => {
    if (!m) return '-'
    const houseNo = m.houseNo || m.address || ''
    const moo = m.village || m.moo ? `หมู่ ${m.village || m.moo}` : ''
    const sub = m.subdistrict || m.tumbol ? `ต.${m.subdistrict || m.tumbol}` : ''
    const dist = m.district || m.amphur ? `อ.${m.district || m.amphur}` : ''
    const prov = m.province ? `จ.${m.province}` : ''
    const zip = m.zipcode || m.zip || ''
    return [houseNo, moo, sub, dist, prov, zip].filter(Boolean).join(' ')
  }

  return (
    <div style={{ maxWidth: 850, margin: '20px auto', padding: 16 }}>
      <Card 
        title={
          <Space>
            <FileTextOutlined style={{ color: primaryColor }} />
            <span>แก้ไขยอดค้างชำระยกมา (ดึงข้อมูลจริงจากระบบ)</span>
          </Space>
        }
        style={{ borderRadius: 8, border: `2px solid ${primaryColor}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: '#f0f9ff' }}
      >
        <div style={{ background: '#ffffff', padding: 24, borderRadius: 8, border: '1px solid #cbd5e1' }}>
          
          {/* ช่องค้นหาเลขสมาชิก */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col xs={6} style={{ textAlign: 'right' }}><Text strong>สมาชิกเลขที่</Text></Col>
            <Col xs={10}>
              <Space.Compact style={{ width: '100%' }}>
                <Input 
                  value={memberIdQuery} 
                  onChange={e => setMemberIdQuery(e.target.value)} 
                  onPressEnter={() => handleSearchMember()}
                  placeholder="กรอกเลขสมาชิกจริง..." 
                />
                <Button type="primary" icon={<SearchOutlined />} onClick={() => handleSearchMember()} style={{ background: primaryColor }} />
              </Space.Compact>
            </Col>
            <Col xs={8}>
              <Text strong style={{ color: '#1d4ed8' }}>
                กลุ่ม: {currentMember?.group || currentMember?.memberGroup || '-'}
              </Text>
            </Col>
          </Row>

          {/* ชื่อสมาชิก */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col xs={6} style={{ textAlign: 'right' }}><Text strong>ชื่อ</Text></Col>
            <Col xs={18}>
              <Text style={{ fontSize: '15px', fontWeight: '500', color: '#0f172a' }}>
                {currentMember ? (currentMember.name || currentMember.fullname || `${currentMember.prefix || ''}${currentMember.firstName || ''} ${currentMember.lastName || ''}`) : '-'}
              </Text>
            </Col>
          </Row>

          {/* ที่อยู่สมาชิก */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
            <Col xs={6} style={{ textAlign: 'right' }}><Text strong>ที่อยู่</Text></Col>
            <Col xs={18}>
              <Text style={{ color: '#334155' }}>{renderFullAddress(currentMember)}</Text>
            </Col>
          </Row>

          <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', marginBottom: 24 }} />

          {/* ยอดค้างชำระเดิม */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col xs={10} style={{ textAlign: 'right' }}><Text strong>ยอดค้างชำระเดิม</Text></Col>
            <Col xs={8}>
              <Input 
                value={Number(currentMember?.arrears ?? currentMember?.prevArrears ?? 0).toLocaleString()} 
                readOnly 
                style={{ textAlign: 'right', background: '#f8fafc', fontWeight: 'bold' }} 
              />
            </Col>
          </Row>

          {/* ยอดค้างชำระใหม่ */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col xs={10} style={{ textAlign: 'right' }}><Text strong>ยอดค้างชำระใหม่</Text></Col>
            <Col xs={8}>
              <Input 
                value={newArrears} 
                onChange={e => setNewArrears(e.target.value)} 
                style={{ textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }} 
              />
            </Col>
          </Row>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Text type="danger" style={{ fontSize: '13px' }}>หมายเหตุ ใช้แก้ไขยอดค้างชำระยกมา (ดึงข้อมูลจริงจากระบบ)</Text>
          </div>

          {/* ปุ่มควบคุม */}
          <Row justify="space-between" align="middle" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            <Col>
              <Button icon={<UndoOutlined />} onClick={() => { setMemberIdQuery(''); setCurrentMember(null); setNewArrears('0'); }} style={{ fontWeight: 'bold' }}>
                ล้างค่า
              </Button>
            </Col>
            <Col>
              <Space>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveArrears} style={{ background: '#059669', fontWeight: 'bold', minWidth: 110 }}>
                  บันทึก [F9]
                </Button>
                <Button icon={<CloseOutlined />} onClick={() => window.history.back()} style={{ fontWeight: 'bold', minWidth: 90 }}>
                  ปิด
                </Button>
              </Space>
            </Col>
          </Row>

        </div>
      </Card>
    </div>
  )
}