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
  SaveOutlined, 
  StopOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography
const { Option } = Select

export default function MemberResigned() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [searchId, setSearchId] = useState('')
  const [currentMember, setCurrentMember] = useState(null)

  // ฟอร์มบันทึกการลาออก / ให้ออก / ขาดสิทธิ / เสียชีวิตก่อนรับสิทธิ
  const [resignationType, setResignationType] = useState('ลาออก')
  const [resignationDate, setResignationDate] = useState(dayjs())
  const [reason, setReason] = useState('')
  const [noticeDate, setNoticeDate] = useState(dayjs())
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
      String(m.memberId || m.code || m.id || m.member_id || '') === String(query)
    )

    // 2. ถ้าไม่เจอ ลองค้นจากใบเสร็จ
    const rawReceipts = JSON.parse(localStorage.getItem('funeral_receipts')) || 
                        JSON.parse(localStorage.getItem('receipts')) || []

    const matchedReceipt = rawReceipts.find(r => 
      String(r.memberId || r.member_id || r.code || '') === String(query)
    )

    if (!found && !matchedReceipt) {
      message.error('ไม่พบข้อมูลสมาชิกดังกล่าวในระบบ')
      setCurrentMember(null)
      return
    }

    // ดึงข้อมูลให้ตรงกันทุกคีย์
    const resolvedId = found?.memberId || found?.code || found?.id || found?.member_id || matchedReceipt?.memberId || matchedReceipt?.code || query
    const resolvedName = found?.name || found?.memberName || found?.member_name || found?.fullname || 
                         matchedReceipt?.memberName || matchedReceipt?.member_name || matchedReceipt?.name || 
                         (found?.firstName ? `${found.prefix || ''}${found.firstName} ${found.lastName || ''}` : 'ไม่ระบุชื่อ')

    const resolvedGroup = found?.group || found?.villageGroup || found?.groupNo || matchedReceipt?.group || '0'
    const resolvedAddress = found?.address || `หมู่ ${found?.moo || '1'} ต.${found?.district || 'เซกา'} อ.${found?.amphoe || 'เมือง'} จ.${found?.province || 'บึงกาฬ'}`

    const memberObj = {
      memberId: resolvedId,
      name: resolvedName,
      group: resolvedGroup,
      address: resolvedAddress,
      regDate: found?.regDate || matchedReceipt?.date || dayjs().format('YYYY-MM-DD'),
      startCoverDate: found?.startCoverDate || dayjs().format('YYYY-MM-DD')
    }

    setCurrentMember(memberObj)
    setResignationDate(dayjs())
    setNoticeDate(dayjs())
    setLastPaymentDate(found?.lastPaymentDate || matchedReceipt?.date ? dayjs(found?.lastPaymentDate || matchedReceipt?.date).format('DD/MM/YYYY') : '26/10/2026')
    setRemainingBalance(Number(found?.balance || found?.advance || matchedReceipt?.total || 0))

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
          status: resignationType,
          resignationType,
          resignationDate: resignationDate ? resignationDate.format('YYYY-MM-DD') : '',
          resignationReason: reason,
          noticeDate: noticeDate ? noticeDate.format('YYYY-MM-DD') : ''
        }
      }
      return m
    })

    localStorage.setItem('funeral_members', JSON.stringify(updatedMembers))
    localStorage.setItem('members', JSON.stringify(updatedMembers))
    message.success(`บันทึกข้อมูล (${resignationType}) ของสมาชิกเรียบร้อยแล้ว!`)
  }

  const handleClear = () => {
    setCurrentMember(null)
    setSearchId('')
    setReason('')
    message.info('ล้างข้อมูลหน้าจอแล้ว')
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40, padding: '16px' }}>
      
      <Card 
        title={<Space><UserOutlined style={{ color: primaryColor }} /><span>บันทึกสมาชิกลาออก ให้ออก ขาดสิทธิ หรือตายก่อนได้รับสิทธิ</span></Space>}
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

      <Card style={{ borderRadius: 8, marginBottom: 16, background: '#fef3c7', border: '1px solid #fde68a' }}>
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
            <Text strong>ชื่อ:</Text> <Text style={{ fontSize: 16, color: '#b45309', fontWeight: 'bold' }}>{currentMember?.name || '-'}</Text>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col xs={24} md={24}>
            <Text strong>ที่อยู่:</Text> <Text>{currentMember?.address || '-'}</Text>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 8, marginBottom: 16, background: '#fffbeb', border: '1px solid #fef3c7' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>วันที่สมัคร</Text>
            <DatePicker value={currentMember?.regDate ? dayjs(currentMember.regDate) : null} disabled format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
          </Col>
          <Col xs={24} md={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>วันที่เริ่มคุ้มครอง</Text>
            <DatePicker value={currentMember?.startCoverDate ? dayjs(currentMember.startCoverDate) : null} disabled format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
          </Col>

          <Col xs={24} md={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>ประเภทการออก</Text>
            <Select value={resignationType} onChange={setResignationType} style={{ width: '100%' }} size="large">
              <Option value="ลาออก">ลาออก</Option>
              <Option value="ให้ออก">ให้ออก</Option>
              <Option value="ขาดสิทธิ">ขาดสิทธิ</Option>
              <Option value="เสียชีวิตก่อนได้รับสิทธิ">เสียชีวิตก่อนได้รับสิทธิ</Option>
            </Select>
          </Col>
          <Col xs={24} md={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>วันที่ออก</Text>
            <DatePicker value={resignationDate} onChange={setResignationDate} format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
          </Col>

          <Col xs={24} md={24}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>สาเหตุการออก</Text>
            <Input size="large" placeholder="ระบุสาเหตุการออก..." value={reason} onChange={e => setReason(e.target.value)} />
          </Col>

          <Col xs={24} md={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>วันที่บันทึกรับแจ้ง</Text>
            <DatePicker value={noticeDate} onChange={setNoticeDate} format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
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
            <Button size="large" icon={<StopOutlined />} onClick={handleClear}>
              ยกเลิก
            </Button>
            <Button size="large" icon={<SearchOutlined />} onClick={() => handleSearchMember('1')}>
              ผู้ลาออกปีนี้
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