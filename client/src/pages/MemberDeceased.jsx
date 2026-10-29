import { useState, useEffect } from 'react'
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
  InputNumber, 
  message 
} from 'antd'
import { 
  UserOutlined, 
  SearchOutlined, 
  SaveOutlined, 
  CalculatorOutlined, 
  StopOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography
const { Option } = Select

export default function MemberDeceased() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  const [searchId, setSearchId] = useState('')
  const [currentMember, setCurrentMember] = useState(null)
  const [memberBirthDate, setMemberBirthDate] = useState(null)

  // ฟอร์มบันทึกสมาชิกเสียชีวิต
  const [deathDate, setDeathDate] = useState(dayjs())
  const [deathCertNo, setDeathCertNo] = useState('')
  const [deathReason, setDeathReason] = useState('')
  const [age, setAge] = useState(0)
  const [cutoffDate, setCutoffDate] = useState(dayjs())
  const [corpseNo, setCorpseNo] = useState('1')
  const [rightStatus, setRightStatus] = useState('ได้รับสิทธิสมบูรณ์')

  // ข้อมูลคำนวณเงินสงเคราะห์ (ซิงค์จำนวนสมาชิกจริงจาก LocalStorage)
  const [totalMembers, setTotalMembers] = useState(0)
  const [collectedMembers, setCollectedMembers] = useState(0)
  const [welfareRate, setWelfareRate] = useState(8.00)
  
  // งวดการจ่ายเงิน
  const [installment1, setInstallment1] = useState(0)
  const [date1, setDate1] = useState(null)
  const [installment2, setInstallment2] = useState(0)
  const [date2, setDate2] = useState(null)
  const [installment3, setInstallment3] = useState(0)
  const [date3, setDate3] = useState(null)

  // โหลดและนับจำนวนสมาชิกจาก LocalStorage เมื่อเปิดหน้าจอ
  useEffect(() => {
    const rawMembers = JSON.parse(localStorage.getItem('funeral_members')) || 
                       JSON.parse(localStorage.getItem('members')) || []
    
    const activeMembers = rawMembers.filter(m => m.status !== 'เสียชีวิต')
    const activeCount = activeMembers.length > 0 ? activeMembers.length : (rawMembers.length > 0 ? rawMembers.length : 0)
    
    setTotalMembers(activeCount)
    setCollectedMembers(activeCount)

    const deceasedCount = rawMembers.filter(m => m.status === 'เสียชีวิต').length
    setCorpseNo(String(deceasedCount > 0 ? deceasedCount + 1 : 1))
  }, [])

  const handleSearchMember = (idToSearch) => {
    const query = idToSearch || searchId.trim()
    if (!query) {
      message.warning('กรุณากรอกเลขที่สมาชิกเพื่อค้นหา')
      return
    }

    const rawMembers = JSON.parse(localStorage.getItem('funeral_members')) || 
                       JSON.parse(localStorage.getItem('members')) || []

    let found = rawMembers.find(m => 
      String(m.memberId || m.code || m.id || m.member_id || '') === query
    )

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

    const resolvedId = found?.memberId || found?.code || found?.id || found?.member_id || matchedReceipt?.memberId || matchedReceipt?.code || query
    const resolvedName = found?.name || found?.memberName || found?.member_name || found?.fullname || 
                         matchedReceipt?.memberName || matchedReceipt?.member_name || matchedReceipt?.name || 
                         (found?.firstName ? `${found.prefix || ''}${found.firstName} ${found.lastName || ''}` : 'ไม่ระบุชื่อ')

    const resolvedGroup = found?.group || found?.villageGroup || matchedReceipt?.group || '0'

    // ดึงวันเดือนปีเกิดเพื่อคำนวณอายุตามจริง
    const bDateStr = found?.birthDate || found?.birthday || found?.dob || found?.birth_date
    const bDate = bDateStr ? dayjs(bDateStr) : null
    setMemberBirthDate(bDate)

    const currentDeathDate = dayjs()
    let calculatedAge = 0
    if (bDate) {
      calculatedAge = currentDeathDate.diff(bDate, 'year')
    } else if (found?.age) {
      calculatedAge = Number(found.age)
    }

    const memberObj = {
      memberId: resolvedId,
      name: resolvedName,
      group: resolvedGroup,
      regDate: found?.regDate || matchedReceipt?.date || dayjs().format('YYYY-MM-DD'),
      startCoverDate: found?.startCoverDate || dayjs().format('YYYY-MM-DD')
    }

    setCurrentMember(memberObj)
    setDeathDate(currentDeathDate)
    setCutoffDate(currentDeathDate)
    setAge(calculatedAge)
    
    const activeMembers = rawMembers.filter(m => m.status !== 'เสียชีวิต')
    const activeCount = activeMembers.length > 0 ? activeMembers.length : (rawMembers.length > 0 ? rawMembers.length : 0)
    const calculatedTotalPayable = activeCount * 50
    setInstallment1(calculatedTotalPayable)
    setDate1(dayjs())

    message.success(`พบข้อมูลสมาชิก: ${resolvedName} (อายุ: ${calculatedAge} ปี)`)
  }

  // ฟังก์ชันเมื่อเปลี่ยนวันที่เสียชีวิต ให้คำนวณอายุใหม่ทันที
  const handleDeathDateChange = (val) => {
    setDeathDate(val)
    if (memberBirthDate && val) {
      const diffYears = val.diff(memberBirthDate, 'year')
      setAge(diffYears >= 0 ? diffYears : 0)
    }
  }

  const totalPayableAmount = totalMembers > 0 ? totalMembers * 50 : 0
  const welfareDeduction = (totalPayableAmount * welfareRate) / 100
  const netPayable = totalPayableAmount - welfareDeduction

  const handleCalculateCorpseNo = () => {
    const rawMembers = JSON.parse(localStorage.getItem('funeral_members')) || 
                       JSON.parse(localStorage.getItem('members')) || []
    const deceasedCount = rawMembers.filter(m => m.status === 'เสียชีวิต').length
    setCorpseNo(String(deceasedCount > 0 ? deceasedCount + 1 : 1))
    message.success('คำนวณลำดับศพจากฐานข้อมูลเรียบร้อยแล้ว')
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
          status: 'เสียชีวิต',
          deathDate: deathDate ? deathDate.format('YYYY-MM-DD') : '',
          deathCertNo,
          deathReason,
          age,
          cutoffDate: cutoffDate ? cutoffDate.format('YYYY-MM-DD') : '',
          corpseNo,
          rightStatus,
          netPayable
        }
      }
      return m
    })

    localStorage.setItem('funeral_members', JSON.stringify(updatedMembers))
    localStorage.setItem('members', JSON.stringify(updatedMembers))
    message.success('บันทึกข้อมูลสมาชิกเสียชีวิตและซิงค์ข้อมูลเรียบร้อยแล้ว!')
  }

  const handleClear = () => {
    setCurrentMember(null)
    setSearchId('')
    setDeathCertNo('')
    setDeathReason('')
    setAge(0)
    message.info('ล้างข้อมูลหน้าจอแล้ว')
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40, padding: '16px' }}>
      
      <Card 
        title={<Space><UserOutlined style={{ color: primaryColor }} /><span>บันทึกสมาชิกเสียชีวิต ที่ได้รับเงินสวัสดิการ</span></Space>}
        style={{ borderRadius: 8, marginBottom: 16, borderLeft: `4px solid ${primaryColor}` }}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
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
          <Col xs={24} md={4}>
            <Button type="primary" size="large" icon={<SearchOutlined />} onClick={() => handleSearchMember()} style={{ background: primaryColor, width: '100%' }}>
              ค้นหา
            </Button>
          </Col>
          <Col xs={24} md={6}>
            <Text strong>กลุ่ม:</Text> <Text>{currentMember?.group || '-'}</Text>
          </Col>
          <Col xs={24} md={6}>
            <Text strong>ชื่อ:</Text> <Text style={{ color: '#0d9488', fontWeight: 'bold' }}>{currentMember?.name || '-'}</Text>
          </Col>
        </Row>
      </Card>

      <Card size="small" style={{ borderRadius: 8, marginBottom: 16, background: '#f8fafc' }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Text type="secondary">วันที่สมัคร: </Text>
            <Text strong>{currentMember?.regDate ? dayjs(currentMember.regDate).format('DD/MM/YYYY') : '-'}</Text>
          </Col>
          <Col xs={24} md={12}>
            <Text type="secondary">วันที่เริ่มคุ้มครอง: </Text>
            <Text strong>{currentMember?.startCoverDate ? dayjs(currentMember.startCoverDate).format('DD/MM/YYYY') : '-'}</Text>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 8, marginBottom: 16, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>วันที่เสียชีวิต (วันที่แจ้งตาย)</Text>
            <DatePicker value={deathDate} onChange={handleDeathDateChange} format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
          </Col>
          <Col xs={24} md={9}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>เลขที่ใบมรณบัตร</Text>
            <Input size="large" placeholder="ระบุเลขที่ใบมรณบัตร..." value={deathCertNo} onChange={e => setDeathCertNo(e.target.value)} />
          </Col>
          <Col xs={24} md={9}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>สาเหตุเสียชีวิต</Text>
            <Input size="large" placeholder="ระบุสาเหตุเสียชีวิต..." value={deathReason} onChange={e => setDeathReason(e.target.value)} />
          </Col>

          <Col xs={24} md={4}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>อายุ</Text>
            <InputNumber size="large" value={age} onChange={setAge} style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={6}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>วันที่ตัดยอด</Text>
            <DatePicker value={cutoffDate} onChange={setCutoffDate} format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
          </Col>
          <Col xs={24} md={7}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>ศพที่</Text>
            <Space.Compact style={{ width: '100%' }}>
              <Input size="large" value={corpseNo} onChange={e => setCorpseNo(e.target.value)} />
              <Button size="large" icon={<CalculatorOutlined />} onClick={handleCalculateCorpseNo} style={{ background: '#e2e8f0' }}>คำนวณ</Button>
            </Space.Compact>
          </Col>
          <Col xs={24} md={7}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>สถานะได้รับสิทธิ</Text>
            <Select value={rightStatus} onChange={setRightStatus} style={{ width: '100%' }} size="large">
              <Option value="ได้รับสิทธิสมบูรณ์">ได้รับสิทธิสมบูรณ์</Option>
              <Option value="รอตรวจสอบ">รอตรวจสอบ</Option>
              <Option value="ไม่ได้รับสิทธิ">ไม่ได้รับสิทธิ</Option>
            </Select>
          </Col>
        </Row>
        <div style={{ marginTop: 12 }}>
          <Text type="danger" strong>การคำนวณหาลำดับล่าสุดโดยใช้ปีจากวันที่ตัดยอด | จำนวนสมาชิกที่หัก {totalMembers.toLocaleString()} คน จำนวนเงินที่จะต้องจ่าย {totalPayableAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</Text>
        </div>
      </Card>

      <Card style={{ borderRadius: 8, marginBottom: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Text type="secondary">จำนวนสมาชิก</Text>
            <InputNumber size="large" value={totalMembers} onChange={setTotalMembers} style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary">จำนวนสมาชิกเก็บได้</Text>
            <InputNumber size="large" value={collectedMembers} onChange={setCollectedMembers} style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary">ได้รับเงินสงเคราะห์</Text>
            <InputNumber size="large" value={totalPayableAmount} disabled style={{ width: '100%', color: '#059669', fontWeight: 'bold' }} />
          </Col>

          <Col xs={24} md={8}>
            <Text type="secondary">อัตราหักสวัสดิการ %</Text>
            <InputNumber size="large" value={welfareRate} onChange={setWelfareRate} style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary">เงินหักสวัสดิการ</Text>
            <InputNumber size="large" value={welfareDeduction} disabled style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary">เงินต้องจ่ายสุทธิ</Text>
            <InputNumber size="large" value={netPayable} disabled style={{ width: '100%', color: '#dc2626', fontWeight: 'bold' }} />
          </Col>

          <Col xs={24} md={12}>
            <Space style={{ width: '100%' }} direction="vertical">
              <Text type="secondary">เงินจ่ายงวดที่ 1</Text>
              <InputNumber size="large" value={installment1} onChange={setInstallment1} style={{ width: '100%' }} />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space style={{ width: '100%' }} direction="vertical">
              <Text type="secondary">วันที่จ่ายงวดที่ 1</Text>
              <DatePicker value={date1} onChange={setDate1} format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
            </Space>
          </Col>

          <Col xs={24} md={12}>
            <Space style={{ width: '100%' }} direction="vertical">
              <Text type="secondary">เงินจ่ายงวดที่ 2</Text>
              <InputNumber size="large" value={installment2} onChange={setInstallment2} style={{ width: '100%' }} />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space style={{ width: '100%' }} direction="vertical">
              <Text type="secondary">วันที่จ่ายงวดที่ 2</Text>
              <DatePicker value={date2} onChange={setDate2} format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
            </Space>
          </Col>

          <Col xs={24} md={12}>
            <Space style={{ width: '100%' }} direction="vertical">
              <Text type="secondary">เงินจ่ายงวดที่ 3</Text>
              <InputNumber size="large" value={installment3} onChange={setInstallment3} style={{ width: '100%' }} />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space style={{ width: '100%' }} direction="vertical">
              <Text type="secondary">วันที่จ่ายงวดที่ 3</Text>
              <DatePicker value={date3} onChange={setDate3} format="DD/MM/YYYY" style={{ width: '100%' }} size="large" />
            </Space>
          </Col>
        </Row>

        <div style={{ marginTop: 24, textAlign: 'right', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <Space>
            <Button size="large" icon={<StopOutlined />} onClick={handleClear}>
              ยกเลิก
            </Button>
            <Button size="large" icon={<SearchOutlined />} onClick={() => handleSearchMember('1')}>
              แสดงชื่อผู้เสียชีวิต
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