import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { 
  Card, 
  Input, 
  DatePicker, 
  Select, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Space, 
  message 
} from 'antd'
import { 
  UserOutlined, 
  SearchOutlined, 
  SaveOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography
const { Option } = Select

export default function MemberStatusIndividual() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [searchId, setSearchId] = useState('')
  const [currentMember, setCurrentMember] = useState(null)

  // ฟอร์มข้อมูลสถานภาพสมาชิก
  const [regDate, setRegDate] = useState(dayjs())
  const [startCoverDate, setStartCoverDate] = useState(dayjs())
  const [newCoverDate, setNewCoverDate] = useState(dayjs())
  const [coverStatus, setCoverStatus] = useState('ได้รับความคุ้มครอง')
  const [lastPaymentDate, setLastPaymentDate] = useState('-')
  const [remainingBalance, setRemainingBalance] = useState(0)

  const handleSearchMember = (idToSearch) => {
    const query = idToSearch || searchId.trim()
    if (!query) {
      message.warning('กรุณากรอกเลขที่สมาชิกเพื่อค้นหา')
      return
    }

    // 1. ค้นหาในฐานข้อมูลสมาชิก
    const rawMembers = JSON.parse(localStorage.getItem('funeral_members')) || 
                       JSON.parse(localStorage.getItem('members')) || []

    let found = rawMembers.find(m => 
      String(m.memberId || m.code || m.id || m.member_id || '') === query
    )

    // 2. ถ้าไม่เจอในสมาชิก ลองค้นจากใบเสร็จ
    const rawReceipts = JSON.parse(localStorage.getItem('funeral_receipts')) || 
                        JSON.parse(localStorage.getItem('receipts')) || []

    const matchedReceipt = rawReceipts.find(r => 
      String(r.memberId || r.member_id || r.code || '') === query
    )

    if (!found && !matchedReceipt) {
      message.error('ไม่พบข้อมูลสมาชิกดังกล่าวในระบบ')
      setCurrentMember(null)
      return
    }

    // 3. ดึงข้อมูลให้ครอบคลุมทุกคีย์
    const resolvedId = found?.memberId || found?.code || found?.id || found?.member_id || matchedReceipt?.memberId || matchedReceipt?.code || query
    const resolvedName = found?.name || found?.memberName || found?.member_name || found?.fullname || 
                         matchedReceipt?.memberName || matchedReceipt?.member_name || matchedReceipt?.name || 
                         (found?.firstName ? `${found.prefix || ''}${found.firstName} ${found.lastName || ''}` : 'ไม่ระบุชื่อ')

    const resolvedGroup = found?.group || found?.villageGroup || matchedReceipt?.group || '0'
    const resolvedAddress = found?.address || `หมู่ ${found?.moo || '1'} ต.${found?.district || 'เซกา'} อ.${found?.amphoe || 'เมือง'} จ.${found?.province || 'บึงกาฬ'}`

    const memberObj = {
      memberId: resolvedId,
      name: resolvedName,
      group: resolvedGroup,
      address: resolvedAddress
    }

    setCurrentMember(memberObj)
    setRegDate(found?.regDate ? dayjs(found.regDate) : dayjs())
    setStartCoverDate(found?.startCoverDate ? dayjs(found.startCoverDate) : dayjs())
    setNewCoverDate(found?.newCoverDate ? dayjs(found.newCoverDate) : dayjs())
    setCoverStatus(found?.coverStatus || 'ได้รับความคุ้มครอง')
    setLastPaymentDate(found?.lastPaymentDate || matchedReceipt?.date ? dayjs(found?.lastPaymentDate || matchedReceipt?.date).format('DD/MM/YYYY') : '26/10/2026')
    setRemainingBalance(Number(found?.balance || found?.advance || matchedReceipt?.total || 4650))

    message.success(`พบข้อมูลสมาชิก: ${resolvedName}`)
  }

  const handleSave = () => {
    if (!currentMember) {
      message.warning('กรุณาค้นหาและเลือกสมาชิกก่อนทำการบันทึก')
      return
    }

    const rawMembers = JSON.parse(localStorage.getItem('funeral_members')) || 
                       JSON.parse(localStorage.getItem('members')) || []

    const targetId = String(currentMember.memberId)

    const updatedMembers = rawMembers.map(m => {
      const mId = String(m.memberId || m.code || m.id || m.member_id || '')
      if (mId === targetId) {
        return {
          ...m,
          regDate: regDate ? regDate.format('YYYY-MM-DD') : m.regDate,
          startCoverDate: startCoverDate ? startCoverDate.format('YYYY-MM-DD') : m.startCoverDate,
          newCoverDate: newCoverDate ? newCoverDate.format('YYYY-MM-DD') : m.newCoverDate,
          coverStatus,
          balance: remainingBalance
        }
      }
      return m
    })

    let finalMembers = updatedMembers
    if (!finalMembers.some(m => String(m.memberId || m.code || m.id) === targetId)) {
      finalMembers.push({
        memberId: targetId,
        name: currentMember.name,
        group: currentMember.group,
        address: currentMember.address,
        regDate: regDate ? regDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        startCoverDate: startCoverDate ? startCoverDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        newCoverDate: newCoverDate ? newCoverDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        coverStatus,
        balance: remainingBalance
      })
    }

    localStorage.setItem('funeral_members', JSON.stringify(finalMembers))
    localStorage.setItem('members', JSON.stringify(finalMembers))
    message.success('บันทึกและซิงค์สถานภาพสมาชิกเรียบร้อยแล้ว!')
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40, padding: '16px' }}>
      
      <Card 
        title={<Space><UserOutlined style={{ color: primaryColor }} /><span>บันทึกปรับสถานภาพสมาชิกให้ได้รับสิทธิ รายบุคคล</span></Space>}
        style={{ borderRadius: 8, marginBottom: 16, borderLeft: `4px solid ${primaryColor}` }}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} md={10}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>สมาชิกเลขที่</Text>
            <Input 
              size="large"
              placeholder="ระบุเลขที่สมาชิก..." 
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              onPressEnter={() => handleSearchMember()}
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
            />
          </Col>
          <Col xs={24} md={6} style={{ paddingTop: 22 }}>
            <Button type="primary" size="large" icon={<SearchOutlined />} onClick={() => handleSearchMember()} style={{ background: primaryColor, width: '100%' }}>
              ค้นหา
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 8, marginBottom: 16, background: '#e6fffa', border: '1px solid #b2f5ea' }}>
        <Row gutter={24} style={{ marginBottom: 12 }}>
          <Col xs={24} md={12}>
            <Text strong>สมาชิกเลขที่:</Text> <Text>{currentMember?.memberId || '-'}</Text>
          </Col>
          <Col xs={24} md={12}>
            <Text strong>กลุ่ม:</Text> <Text>{currentMember?.group || '0'}</Text>
          </Col>
        </Row>
        <Row gutter={24} style={{ marginBottom: 12 }}>
          <Col xs={24} md={24}>
            <Text strong>ชื่อ:</Text> <Text style={{ fontSize: 16, color: '#0d9488', fontWeight: 'bold' }}>{currentMember?.name || '-'}</Text>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col xs={24} md={24}>
            <Text strong>ที่อยู่:</Text> <Text>{currentMember?.address || '-'}</Text>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 8, marginBottom: 16, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>วันที่สมัคร</Text>
            <DatePicker value={regDate} onChange={setRegDate} format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
          </Col>
          <Col xs={24} md={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>วันที่เริ่มคุ้มครอง</Text>
            <DatePicker value={startCoverDate} onChange={setStartCoverDate} format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
          </Col>

          <Col xs={24} md={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>วันที่คุ้มครองใหม่</Text>
            <DatePicker value={newCoverDate} onChange={setNewCoverDate} format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
          </Col>
          <Col xs={24} md={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>สถานะได้คุ้มครอง</Text>
            <Select value={coverStatus} onChange={setCoverStatus} style={{ width: '100%' }} size="large">
              <Option value="ได้รับความคุ้มครอง">ได้รับความคุ้มครอง</Option>
              <Option value="สมาชิกใหม่">สมาชิกใหม่</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space size="large">
              <Text strong>ชำระครั้งล่าสุด:</Text> <Text type="success">{lastPaymentDate}</Text>
            </Space>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: 'right' }}>
            <Space>
              <Text strong style={{ fontSize: 16 }}>ยอดเงินสงเคราะห์คงเหลือ:</Text>
              <span style={{ fontSize: 20, fontWeight: 'bold', color: '#dc2626', background: '#fee2e2', padding: '4px 12px', borderRadius: 4 }}>
                {Number(remainingBalance).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </Space>
          </Col>
        </Row>

        <div style={{ marginTop: 24, textAlign: 'right', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <Space>
            <Button size="large" icon={<SearchOutlined />} onClick={() => handleSearchMember('1')}>
              แสดงสมาชิกใหม่
            </Button>
            <Button type="primary" size="large" icon={<SaveOutlined />} onClick={handleSave} style={{ background: primaryColor, paddingInline: 32 }}>
              บันทึก
            </Button>
          </Space>
        </div>
      </Card>

    </div>
  )
}