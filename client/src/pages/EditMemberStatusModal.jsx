import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Input, Button, Typography, Row, Col, Select, Space, message } from 'antd'
import { SearchOutlined, SaveOutlined, CloseOutlined, UndoOutlined, FileTextOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function EditMemberStatusModal() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [memberIdQuery, setMemberIdQuery] = useState('')
  const [currentMember, setCurrentMember] = useState(null)
  const [newStatus, setNewStatus] = useState('ได้รับสิทธิ')

  // ฟังก์ชันดึงข้อมูลจริงจาก localStorage แบบซิงค์ตรงจุด 100%
  const handleSearchMember = (searchKey) => {
    try {
      const query = searchKey !== undefined ? searchKey : memberIdQuery
      if (!String(query).trim()) {
        message.warning('กรุณากรอกเลขสมาชิกที่ต้องการค้นหา')
        return
      }

      const rawData = localStorage.getItem('funeral_members')
      if (!rawData) {
        message.error('ไม่พบฐานข้อมูลสมาชิก (funeral_members) ในระบบ')
        setCurrentMember(null)
        return
      }

      const members = JSON.parse(rawData)
      if (!Array.isArray(members)) {
        message.error('รูปแบบข้อมูลในฐานข้อมูลไม่ถูกต้อง')
        return
      }

      // ค้นหาจากรหัสสมาชิกจริงตรงจุด (รองรับ id, memberId)
      const found = members.find(m => String(m.id || m.memberId || '').trim() === String(query).trim())

      if (found) {
        setCurrentMember(found)
        const currentMemberStatus = found.status || found.memberStatus || 'ได้รับสิทธิ'
        setNewStatus(currentMemberStatus)
        message.success(`ดึงข้อมูลสมาชิก ${found.name || found.fullname || ''} สำเร็จ`)
      } else {
        setCurrentMember(null)
        message.warning(`ไม่พบสมาชิกเลขที่ "${query}" ในฐานข้อมูลจริง`)
      }
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการอ่านข้อมูลจากระบบ')
    }
  }

  // โหลดข้อมูลอัตโนมัติเมื่อเปิดหน้าจอ
  useEffect(() => {
    handleSearchMember('3')
  }, [])

  // บันทึกสถานะสิทธิใหม่ลงใน localStorage จริง
  const handleSaveStatus = () => {
    if (!currentMember) {
      message.warning('ไม่มีข้อมูลสมาชิกสำหรับบันทึกสถานภาพ')
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
            status: newStatus,
            memberStatus: newStatus
          }
        }
        return m
      })

      localStorage.setItem('funeral_members', JSON.stringify(members))
      message.success('ปรับสถานภาพสิทธิลงฐานข้อมูลจริงเรียบร้อยแล้ว')
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    }
  }

  // ดึงและแสดงที่อยู่จริงจากข้อมูลสมาชิกแบบครบถ้วนทุกส่วน
  const renderFullAddress = (m) => {
    if (!m) return '-'
    if (m.fullAddress) return m.fullAddress

    const houseNo = m.houseNo || m.address || ''
    const moo = m.village || m.moo ? (String(m.village || m.moo).includes('หมู่') ? m.village || m.moo : 'หมู่ ' + (m.village || m.moo)) : ''
    const sub = m.subdistrict || m.tumbol ? (String(m.subdistrict || m.tumbol).includes('ต.') ? m.subdistrict || m.tumbol : 'ต.' + (m.subdistrict || m.tumbol)) : ''
    const dist = m.district || m.amphur ? (String(m.district || m.amphur).includes('อ.') ? m.district || m.amphur : 'อ.' + (m.district || m.amphur)) : ''
    const prov = m.province ? (String(m.province).includes('จ.') ? m.province : 'จ.' + m.province) : ''
    const zip = m.zipcode || m.zip || ''

    return [houseNo, moo, sub, dist, prov, zip].filter(Boolean).join(' ')
  }

  return (
    <div style={{ maxWidth: 850, margin: '20px auto', padding: 16 }}>
      <Card 
        title={
          <Space>
            <FileTextOutlined style={{ color: primaryColor }} />
            <span>ปรับสถานภาพสิทธิ (ดึงข้อมูลจริงจากระบบ)</span>
          </Space>
        }
        style={{ borderRadius: 8, border: '2px solid ' + primaryColor, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: '#f0f9ff' }}
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
                กลุ่ม: {currentMember?.group || currentMember?.memberGroup || currentMember?.groupNo || '-'}
              </Text>
            </Col>
          </Row>

          {/* ชื่อสมาชิก */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col xs={6} style={{ textAlign: 'right' }}><Text strong>ชื่อ</Text></Col>
            <Col xs={18}>
              <Text style={{ fontSize: '15px', fontWeight: '500', color: '#0f172a' }}>
                {currentMember ? (currentMember.name || currentMember.fullname || (String(currentMember.prefix || '') + String(currentMember.firstName || '') + ' ' + String(currentMember.lastName || '')).trim()) : '-'}
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

          {/* เปลี่ยนสถานะสิทธิใหม่ */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 20 }}>
            <Col xs={8} style={{ textAlign: 'right' }}><Text strong>เปลี่ยนสถานะสิทธิใหม่</Text></Col>
            <Col xs={10}>
              <Select 
                value={newStatus} 
                onChange={val => setNewStatus(val)} 
                style={{ width: '100%' }}
                options={[
                  { value: 'ได้รับสิทธิ', label: 'ได้รับสิทธิ' },
                  { value: 'พ้นสภาพ', label: 'พ้นสภาพ' },
                  { value: 'ลาออก', label: 'ลาออก' },
                  { value: 'เสียชีวิต', label: 'เสียชีวิต' }
                ]}
              />
            </Col>
          </Row>

          {/* หมายเหตุ */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Text type="danger" style={{ fontSize: '13px' }}>หมายเหตุ ใช้ปรับสถานภาพให้เป็นผู้ได้รับสิทธิ ใช้กรณีปรับสิทธิผิดพลาด</Text>
          </div>

          {/* ปุ่มควบคุม */}
          <Row justify="space-between" align="middle" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            <Col>
              <Button icon={<UndoOutlined />} onClick={() => { setMemberIdQuery(''); setCurrentMember(null); }} style={{ fontWeight: 'bold' }}>
                ยกเลิก
              </Button>
            </Col>
            <Col>
              <Space>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveStatus} style={{ background: '#059669', fontWeight: 'bold', minWidth: 110 }}>
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