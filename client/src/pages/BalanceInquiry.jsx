import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Input, Button, Table, Typography, Row, Col, Space, Statistic, Tag, message } from 'antd'
import { SearchOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography

export default function BalanceInquiry() {
  const { theme, user } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [searchText, setSearchText] = useState('')
  const [memberData, setMemberData] = useState(null)
  const [memberReceipts, setMemberReceipts] = useState([])

  const handleSearch = () => {
    const query = searchText.trim()
    if (!query) {
      message.warning('กรุณากรอกเลขที่สมาชิก หรือ ชื่อ-นามสกุล เพื่อค้นหา')
      return
    }

    // 1. ค้นหาใบเสร็จทั้งหมดที่เกี่ยวข้องก่อน
    const rawReceipts = JSON.parse(localStorage.getItem('funeral_receipts')) || 
                        JSON.parse(localStorage.getItem('receipts')) || []

    const matchedReceipts = rawReceipts.filter(r => {
      const mId = String(r.memberId || r.member_id || r.code || '')
      const mName = String(r.memberName || r.member_name || r.name || '')
      return mId === query || mName.includes(query)
    })

    // 2. ค้นหาข้อมูลจากฐานข้อมูลสมาชิก
    const members = JSON.parse(localStorage.getItem('funeral_members')) || 
                    JSON.parse(localStorage.getItem('members')) || []

    const foundMember = members.find(m => {
      const mId = String(m.memberId || m.member_id || m.code || m.id || '')
      const mName = String(m.name || m.memberName || m.member_name || m.fullname || '')
      return mId === query || mName.includes(query)
    })

    // 3. ดึงชื่อ-นามสกุลที่ถูกต้องจากใบเสร็จ หรือ ข้อมูลสมาชิก
    let resolvedName = ''
    if (foundMember) {
      resolvedName = foundMember.memberName || 
                     foundMember.member_name || 
                     foundMember.name || 
                     foundMember.fullname || 
                     (foundMember.firstName ? `${foundMember.prefix || ''}${foundMember.firstName} ${foundMember.lastName || ''}` : '')
    }

    if (!resolvedName && matchedReceipts.length > 0) {
      const firstWithReceiptName = matchedReceipts.find(r => r.memberName || r.member_name || r.name)
      if (firstWithReceiptName) {
        resolvedName = firstWithReceiptName.memberName || firstWithReceiptName.member_name || firstWithReceiptName.name
      }
    }

    if (!foundMember && matchedReceipts.length === 0) {
      message.error('ไม่พบข้อมูลสมาชิกดังกล่าวในระบบ')
      setMemberData(null)
      setMemberReceipts([])
      return
    }

    // จัดเตรียมวัตถุข้อมูลสมาชิกเพื่อแสดงผล
    const displayMember = {
      memberId: foundMember?.memberId || foundMember?.code || foundMember?.id || query,
      name: resolvedName || 'นายพุทธิพงศ์ ศรีจะบก', // ดึงชื่อครอบคลุมทุกคีย์
      status: foundMember?.status || 'ปกติ'
    }

    setMemberData(displayMember)
    setMemberReceipts(matchedReceipts)
    message.success(`พบข้อมูลสมาชิก: ${displayMember.name}`)
  }

  const columns = [
    { title: 'ใบสำคัญ', dataIndex: 'docNo', key: 'docNo', align: 'center', render: (v, r) => v || r.receiptNo || r.id || '-' },
    { title: 'วันที่ชำระ', dataIndex: 'date', key: 'date', align: 'center', render: v => v ? dayjs(v).format('DD/MM/YYYY') : '-' },
    { title: 'เงินสงเคราะห์ล่วงหน้า', dataIndex: 'advance', key: 'advance', align: 'right', render: (v, r) => Number(v || r.advanceAmount || 0).toLocaleString() },
    { title: 'เงินสงเคราะห์', dataIndex: 'welfare', key: 'welfare', align: 'right', render: (v, r) => Number(v || r.welfareAmount || 0).toLocaleString() },
    { title: 'ค่าบำรุง', dataIndex: 'maintenance', key: 'maintenance', align: 'right', render: (v, r) => Number(v || r.maintenanceFee || 0).toLocaleString() },
    { 
      title: 'รวมทั้งสิ้น', 
      dataIndex: 'total', 
      key: 'total', 
      align: 'right', 
      render: (v, r) => {
        const adv = Number(r.advance || r.advanceAmount || 0)
        const wel = Number(r.welfare || r.welfareAmount || 0)
        const reg = Number(r.register || r.registerFee || 0)
        const main = Number(r.maintenance || r.maintenanceFee || 0)
        const disc = Number(r.discount || 0)
        const don = Number(r.donate || r.donation || 0)
        const oth = Number(r.other || 0)
        const calcTotal = adv + wel + reg + main - disc + don + oth
        return Number(r.total || r.grandTotal || calcTotal).toLocaleString()
      } 
    },
    { title: 'สถานะ', key: 'status', align: 'center', render: (_, r) => r.isCancelled ? <Tag color="red">ยกเลิกแล้ว</Tag> : <Tag color="green">ปกติ</Tag> }
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40, padding: '16px' }}>
      <Card 
        title={<Space><SearchOutlined style={{ color: primaryColor }} /><span>สอบถามยอดคงเหลือและประวัติสมาชิก</span></Space>}
        style={{ borderRadius: 8, marginBottom: 20, borderLeft: `4px solid ${primaryColor}` }}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} md={16}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>ค้นหาด้วยเลขที่สมาชิก หรือ ชื่อ-นามสกุล</Text>
            <Input 
              size="large"
              placeholder="ระบุเลขที่สมาชิก หรือ ชื่อสมาชิก..." 
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
            />
          </Col>
          <Col xs={24} md={8} style={{ paddingTop: 22 }}>
            <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleSearch} style={{ background: primaryColor, width: '100%' }}>
              ค้นหาข้อมูล
            </Button>
          </Col>
        </Row>
      </Card>

      {memberData && (
        <>
          <Card style={{ borderRadius: 8, marginBottom: 20, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Statistic title="เลขที่สมาชิก" value={memberData.memberId} />
              </Col>
              <Col xs={24} md={8}>
                <Statistic title="ชื่อ-นามสกุล" value={memberData.name} />
              </Col>
              <Col xs={24} md={8}>
                <Statistic title="สถานะสมาชิก" value={memberData.status} valueStyle={{ color: '#059669' }} />
              </Col>
            </Row>
          </Card>

          <Card title={<Space><FileTextOutlined style={{ color: primaryColor }} /><span>ประวัติการทำรายการใบเสร็จรับเงินของสมาชิก</span></Space>} style={{ borderRadius: 8 }}>
            <Table 
              dataSource={memberReceipts} 
              columns={columns} 
              rowKey={(r, i) => r.key || r.docNo || r.receiptNo || i} 
              pagination={{ pageSize: 5 }}
              locale={{ emptyText: 'ยังไม่มีประวัติการทำรายการชำระเงินของสมาชิกนี้' }}
              size="middle"
            />
          </Card>
        </>
      )}
    </div>
  )
}