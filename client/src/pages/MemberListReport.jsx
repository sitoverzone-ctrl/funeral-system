import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Radio, DatePicker, Button, Typography, Row, Col, Input, Table, Space, message } from 'antd'
import { PrinterOutlined, CloseOutlined, SearchOutlined, CheckSquareOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography

export default function MemberListReport() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  // ดึงข้อมูลหน่วยงาน/สมาคม สำหรับแสดงในหัวรายงานตอนพิมพ์
  const [orgInfo, setOrgInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('funeral_organization_info')) || {}
    } catch {
      return {}
    }
  })

  // ประเภทรายงานที่เลือก
  const [reportType, setReportType] = useState('balance') // registerDate, eligible, group, dead, resigned, dismissed, balance
  
  // เงื่อนไขเพิ่มเติม
  const [balanceLimit, setBalanceLimit] = useState('-200')
  const [groupQuery, setGroupQuery] = useState('')

  // ช่วงวันที่
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)

  // ข้อมูลตาราง
  const [memberData, setMemberData] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])

  // ฟังก์ชันหาชื่อ-นามสกุลสมาชิกแบบรองรับทุกรูปแบบ
  const getMemberFullName = (m) => {
    if (!m) return ''
    if (m.name) return m.name
    if (m.fullname) return m.fullname
    const prefix = m.prefix || ''
    const firstName = m.firstName || m.firstname || m.first_name || ''
    const lastName = m.lastName || m.lastname || m.last_name || ''
    return `${prefix}${firstName} ${lastName}`.trim() || `สมาชิกรหัส ${m.id || m.memberId || '-'}`
  }

  // ฟังก์ชันจัดรูปแบบที่อยู่ (รองรับฟิลด์ตำบลและอำเภอทุกรูปแบบชื่อ)
  const getMemberAddress = (m) => {
    if (!m) return '-'
    if (typeof m.address === 'string' && m.address.trim() !== '' && !m.tambon) {
      return m.address
    }
    
    const mooVal = m.moo || m.Moo || ''
    const moo = mooVal ? `ม.${mooVal}` : ''
    
    const tambonVal = m.tambon || m.subdistrict || m.subDistrict || m.tumbol || m.tumbon || m.tambonName || ''
    const tambon = tambonVal ? `ต.${tambonVal}` : ''
    
    const amphoeVal = m.amphoe || m.district || m.amphur || m.ampur || m.amphoeName || ''
    const amphoe = amphoeVal ? `อ.${amphoeVal}` : ''
    
    const parts = [moo, tambon, amphoe].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : (m.address || '-')
  }

  // ฟังก์ชันดึงวันที่สมัครแบบรองรับทุกชื่อฟิลด์
  const getMemberRegisterDate = (m) => {
    const rawDate = m.registerDate || m.regDate || m.date || m.createdDate || m.createdAt
    if (!rawDate) return '-'
    const parsed = dayjs(rawDate)
    return parsed.isValid() ? parsed.format('DD/MM/YYYY') : String(rawDate)
  }

  // ฟังก์ชันโหลดและกรองข้อมูลสมาชิกจาก localStorage จริง 100%
  const handleShowData = () => {
    try {
      const allMembers = JSON.parse(localStorage.getItem('funeral_members')) || []

      let filtered = allMembers.filter(m => {
        const rawDate = m.registerDate || m.regDate || m.date || m.createdDate
        const regDate = rawDate ? dayjs(rawDate) : null

        if (reportType === 'registerDate') {
          if (!startDate || !endDate) return true
          return regDate && regDate.isValid() && 
                 (regDate.isAfter(startDate.startOf('day')) || regDate.isSame(startDate.startOf('day'))) &&
                 (regDate.isBefore(endDate.endOf('day')) || regDate.isSame(endDate.endOf('day')))
        }
        if (reportType === 'eligible') {
          return m.isEligible !== false && m.status !== 'ไม่ผ่านอนุมัติ'
        }
        if (reportType === 'dead') {
          return m.status === 'เสียชีวิต' || m.status === 'ตาย'
        }
        if (reportType === 'resigned') {
          return m.status === 'ลาออก'
        }
        if (reportType === 'dismissed') {
          return m.status === 'ให้ออก' || m.status === 'ถูกให้ออก'
        }
        if (reportType === 'balance') {
          const balance = Number(m.balance !== undefined ? m.balance : (m.advance !== undefined ? m.advance : 0))
          return balance < Number(balanceLimit || 0)
        }
        if (reportType === 'group') {
          if (!groupQuery) return true
          return String(m.group || m.groupId || '').includes(groupQuery)
        }
        return true
      })

      setMemberData(filtered)
      setSelectedRowKeys(filtered.map((r, i) => r.id || i))
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสมาชิก')
    }
  }

  useEffect(() => {
    handleShowData()
  }, [reportType])

  // สร้างข้อความชื่อหัวข้อรายงานสำหรับแสดงผลตอนสั่งพิมพ์
  const getReportTitle = () => {
    let title = 'รายงานรายชื่อสมาชิก'
    if (reportType === 'registerDate') {
      title = 'รายงานรายชื่อสมาชิกตามวันสมัคร'
      if (startDate && endDate) {
        title += ` (ตั้งแต่วันที่ ${dayjs(startDate).format('D MMMM YYYY')} ถึง ${dayjs(endDate).format('D MMMM YYYY')})`
      }
    } else if (reportType === 'eligible') {
      title = 'รายงานรายชื่อสมาชิกที่จะได้รับสิทธิ์'
    } else if (reportType === 'group') {
      title = `รายงานรายชื่อสมาชิกตามกลุ่ม ${groupQuery ? `(${groupQuery})` : ''}`
    } else if (reportType === 'dead') {
      title = 'รายงานรายชื่อสมาชิกเสียชีวิต'
    } else if (reportType === 'resigned') {
      title = 'รายงานรายชื่อสมาชิกลาออก'
    } else if (reportType === 'dismissed') {
      title = 'รายงานรายชื่อสมาชิกถูกให้ออก'
    } else if (reportType === 'balance') {
      title = `รายงานรายชื่อสมาชิกมียอดเงินคงเหลือน้อยกว่า ${balanceLimit || 0} บาท`
    }
    return title
  }

  // Columns สำหรับตารางแสดงรายชื่อ (กำหนดความกว้างพอดีหน้า A4 แนวตั้ง)
  const columns = [
    { title: 'ลำดับ', key: 'index', width: 45, align: 'center', render: (_, __, index) => index + 1 },
    { title: 'รหัส', dataIndex: 'id', key: 'id', width: 70, align: 'center' },
    { title: 'ชื่อ - นามสกุล', key: 'name', width: 150, render: (_, record) => <span style={{ whiteSpace: 'nowrap' }}>{getMemberFullName(record)}</span> },
    { title: 'กลุ่ม', dataIndex: 'group', key: 'group', width: 55, align: 'center', render: (v, r) => v || r.groupId || '-' },
    { title: 'ที่อยู่ (หมู่, ต., อ.)', key: 'address', render: (_, record) => getMemberAddress(record) },
    { title: 'วันที่สมัคร', key: 'registerDate', width: 85, align: 'center', render: (_, record) => getMemberRegisterDate(record) },
    { title: 'สถานะ', dataIndex: 'status', key: 'status', width: 70, align: 'center', render: (v) => v || 'ปกติ' },
    { 
      title: 'ยอดคงเหลือ', 
      key: 'balance', 
      width: 95, 
      align: 'right', 
      render: (_, record) => {
        const bal = record.balance !== undefined ? record.balance : (record.advance !== undefined ? record.advance : 0)
        return `${Number(bal).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
      }
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  }

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', padding: 16 }}>
      
      {/* สไตล์สำหรับการพิมพ์ (Print Style Sheet) ขยายเกือบชิดขอบ A4 พอดี */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible;
          }
          #printable-report-area {
            position: absolute;
            left: 6mm;
            top: 6mm;
            width: calc(100% - 12mm);
            background: #fff !important;
          }
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .ant-table-selection-column { display: none !important; }
          .ant-table { font-size: 8.5pt !important; width: 100% !important; }
          .ant-table-container { border: 1px solid #000 !important; border-radius: 0 !important; background: #fff !important; }
          .ant-table-thead > tr > th { background: #f1f5f9 !important; color: #000 !important; font-weight: bold !important; border-bottom: 1px solid #000 !important; border-right: 1px solid #000 !important; padding: 5px 3px !important; text-align: center !important; }
          .ant-table-tbody > tr > td { border-bottom: 1px solid #000 !important; border-right: 1px solid #000 !important; color: #000 !important; padding: 4px 3px !important; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      <Card 
        bodyStyle={{ background: '#bae6fd', padding: 16, borderRadius: 8 }}
        style={{ borderRadius: 10, border: '2px solid #0284c7', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      >
        {/* แถบเลือกประเภทรายงาน (ซ่อนตอนพิมพ์) */}
        <div className="no-print" style={{ background: '#e0f2fe', padding: 16, borderRadius: 6, marginBottom: 12, border: '1px solid #7dd3fc' }}>
          <Radio.Group 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            style={{ width: '100%' }}
          >
            <Row gutter={[8, 12]}>
              <Col span={8}><Radio value="registerDate"><Text strong>รายชื่อสมาชิกตามวันสมัคร</Text></Radio></Col>
              <Col span={8}><Radio value="eligible"><Text strong>รายชื่อสมาชิกที่จะได้รับสิทธิ์</Text></Radio></Col>
              <Col span={8}>
                <Space size={4}>
                  <Radio value="group"><Text strong>รายชื่อสมาชิกตามกลุ่ม</Text></Radio>
                  <Input 
                    size="small" 
                    style={{ width: 90 }} 
                    disabled={reportType !== 'group'} 
                    value={groupQuery}
                    onChange={(e) => setGroupQuery(e.target.value)}
                  />
                </Space>
              </Col>
              <Col span={8}><Radio value="dead"><Text strong>รายชื่อสมาชิกเสียชีวิต</Text></Radio></Col>
              <Col span={8}><Radio value="resigned"><Text strong>รายชื่อสมาชิกลาออก</Text></Radio></Col>
              <Col span={8}><Radio value="dismissed"><Text strong>รายชื่อสมาชิกถูกให้ออก</Text></Radio></Col>
              <Col span={24}>
                <Space size={8}>
                  <Radio value="balance"><Text strong>รายชื่อสมาชิกมียอดเงินคงเหลือน้อยกว่า</Text></Radio>
                  <Input 
                    size="small" 
                    style={{ width: 80 }} 
                    value={balanceLimit} 
                    disabled={reportType !== 'balance'}
                    onChange={(e) => setBalanceLimit(e.target.value)}
                  />
                  <Text strong>บาท</Text>
                </Space>
              </Col>
            </Row>
          </Radio.Group>
        </div>

        {/* แถบเลือกช่วงวันที่และปุ่มแสดงข้อมูล (ซ่อนตอนพิมพ์) */}
        <div className="no-print" style={{ background: '#e0f2fe', padding: '12px 16px', borderRadius: 6, marginBottom: 16, border: '1px solid #7dd3fc', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Text strong style={{ color: '#0369a1' }}>วันที่ตั้งแต่</Text>
          <DatePicker 
            value={startDate} 
            onChange={(d) => setStartDate(d)} 
            format="DD / MM / YYYY" 
            style={{ width: 160 }} 
            disabled={reportType !== 'registerDate'}
          />
          <Text strong style={{ color: '#0369a1' }}>ถึงวันที่</Text>
          <DatePicker 
            value={endDate} 
            onChange={(d) => setEndDate(d)} 
            format="DD / MM / YYYY" 
            style={{ width: 160 }} 
            disabled={reportType !== 'registerDate'}
          />
          <Button 
            type="primary" 
            icon={<SearchOutlined />} 
            onClick={handleShowData}
            style={{ background: '#0284c7', fontWeight: 'bold' }}
          >
            แสดงข้อมูล
          </Button>
        </div>

        {/* พื้นที่ที่จะพิมพ์ออกกระดาษ A4 */}
        <div id="printable-report-area">
          {/* หัวกระดาษที่จะแสดงเฉพาะตอนพิมพ์ออกเครื่องพิมพ์ */}
          <div className="print-only" style={{ textAlign: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: '15pt', fontWeight: 'bold' }}>{orgInfo.name || 'สมาคมฌาปนกิจสงเคราะห์'}</h2>
            <h3 style={{ margin: '3px 0 0 0', fontSize: '11.5pt', fontWeight: 'normal' }}>{getReportTitle()}</h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '8.5pt', color: '#475569' }}>พิมพ์เมื่อวันที่: {dayjs().format('D MMMM YYYY HH:mm')} น.</p>
          </div>

          {/* ตารางแสดงรายชื่อสมาชิก */}
          <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #7dd3fc', marginBottom: 16 }}>
            <Table 
              dataSource={memberData} 
              columns={columns} 
              rowKey={(r, i) => r.id || i}
              rowSelection={rowSelection}
              size="small"
              pagination={false}
              bordered
              locale={{ emptyText: 'ไม่พบข้อมูลสมาชิกตามเงื่อนไขที่เลือก' }}
            />
          </div>
        </div>

        {/* แถบสรุปจำนวนและปุ่มคำสั่งด้านล่าง (ซ่อนตอนพิมพ์) */}
        <Row className="no-print" justify="space-between" align="middle" style={{ marginTop: 8 }}>
          <Col>
            <Space>
              <Text strong style={{ color: '#0f172a' }}>จำนวน</Text>
              <Input 
                value={memberData.length} 
                readOnly 
                style={{ width: 90, textAlign: 'center', fontWeight: 'bold', background: '#fff' }} 
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<CheckSquareOutlined />} 
                onClick={() => setSelectedRowKeys(memberData.map((r, i) => r.id || i))}
                style={{ fontWeight: 'bold' }}
              >
                เลือกทั้งหมด
              </Button>
              <Button 
                type="primary" 
                icon={<PrinterOutlined />} 
                onClick={() => window.print()} 
                style={{ background: '#334155', fontWeight: 'bold' }}
              >
                พิมพ์
              </Button>
              <Button 
                icon={<CloseOutlined />} 
                onClick={() => window.history.back()}
                style={{ fontWeight: 'bold' }}
              >
                ปิด
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  )
}