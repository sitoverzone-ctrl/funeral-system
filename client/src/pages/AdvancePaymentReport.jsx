import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Button, Typography, Row, Col, Input, Select, Table, Space, message, AutoComplete } from 'antd'
import { PrinterOutlined, SearchOutlined, FileTextOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography

export default function AdvancePaymentReport() {
  const { theme } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  // ดึงข้อมูลหน่วยงานจาก localStorage
  const [orgInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('funeral_organization_info')) || {}
    } catch {
      return {}
    }
  })

  const [groupCode, setGroupCode] = useState('')
  const [memberId, setMemberId] = useState('')
  const [selectedYear, setSelectedYear] = useState(String(dayjs().year() + 543))
  const [reportData, setReportData] = useState([])
  const [memberOptions, setMemberOptions] = useState([])
  const [groupOptions, setGroupOptions] = useState([])

  // โหลดรายชื่อสมาชิกและกลุ่มเริ่มต้นจาก localStorage ทั้งหมด
  useEffect(() => {
    try {
      const members = JSON.parse(localStorage.getItem('funeral_members')) || []
      
      const mOptions = members.map(m => {
        const id = String(m.id || m.memberId || '')
        const name = m.name || m.fullname || `${m.prefix || ''}${m.firstName || ''} ${m.lastName || ''}`.trim()
        return { value: id, label: `${id} - ${name}`, group: m.group || m.groupId || m.village || '-' }
      })
      setMemberOptions(mOptions)

      const groups = [...new Set(members.map(m => m.group || m.groupId || m.village).filter(Boolean))]
      setGroupOptions(groups)
    } catch (e) {
      console.error(e)
    }
  }, [])

  // ฟังก์ชันซิงค์และประมวลผลข้อมูลจากทุกโมดูล
  const handleSearchData = () => {
    try {
      const members = JSON.parse(localStorage.getItem('funeral_members')) || []
      const receipts = JSON.parse(localStorage.getItem('funeral_receipts')) || JSON.parse(localStorage.getItem('receipts')) || []
      const advancePayments = JSON.parse(localStorage.getItem('funeral_advance_payments')) || []

      if (members.length === 0) {
        message.warning('ไม่พบข้อมูลสมาชิกในระบบ (funeral_members)')
      }

      // กรองสมาชิกตามกลุ่ม และ/หรือ รหัสสมาชิกที่เลือก
      const filteredMembers = members.filter(m => {
        const mId = String(m.id || m.memberId || '')
        const mGroup = String(m.group || m.groupId || m.village || '')
        
        const matchMember = !memberId || mId === String(memberId)
        const matchGroup = !groupCode || mGroup === String(groupCode)
        return matchMember && matchGroup
      })

      const reportRows = filteredMembers.map((m, idx) => {
        const mId = String(m.id || m.memberId || '')
        const fullName = m.name || m.fullname || `${m.prefix || ''}${m.firstName || ''} ${m.lastName || ''}`.trim()
        const mGroup = m.group || m.groupId || m.village || '-'

        // 1. ตรวจสอบยอดจากตาราง advance_payments ประจำปีที่เลือก
        const foundAdv = advancePayments.find(
          item => String(item.memberId) === mId && String(item.year) === String(selectedYear)
        )

        // 2. ตรวจสอบยอดจากใบเสร็จรับเงินจริง (funeral_receipts) ที่ตรงกับรหัสสมาชิกและปี พ.ศ.
        const memberReceipts = receipts.filter(r => {
          const matchId = String(r.memberId || r.id || r.member_id) === mId
          if (r.date) {
            const rYear = String(dayjs(r.date).year() + 543)
            return matchId && rYear === String(selectedYear)
          }
          return matchId
        })

        const totalReceiptAdvance = memberReceipts.reduce((sum, r) => sum + Number(r.advance || r.advanceAmount || 0), 0)
        
        const advanceAmount = foundAdv ? Number(foundAdv.amount || foundAdv.advance || 0) : (totalReceiptAdvance || Number(m.advance || m.balance || 0))

        return {
          key: mId || idx + 1,
          no: idx + 1,
          memberId: mId,
          memberName: fullName,
          group: mGroup,
          year: selectedYear,
          advanceAmount: advanceAmount,
          status: advanceAmount > 0 ? 'ชำระแล้ว' : 'ยังไม่ชำระ'
        }
      })

      setReportData(reportRows)
      message.success(`ซิงค์ข้อมูลสำเร็จ (${reportRows.length} รายการ)`)
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการซิงค์ข้อมูล')
    }
  }

  const columns = [
    { title: 'ที่', dataIndex: 'no', key: 'no', width: 50, align: 'center' },
    { title: 'รหัสสมาชิก', dataIndex: 'memberId', key: 'memberId', width: 90, align: 'center' },
    { title: 'ชื่อ - นามสกุล', dataIndex: 'memberName', key: 'memberName', width: 220 },
    { title: 'กลุ่ม', dataIndex: 'group', key: 'group', width: 90, align: 'center' },
    { title: 'ปี พ.ศ.', dataIndex: 'year', key: 'year', width: 80, align: 'center' },
    { 
      title: 'จำนวนเงินทดลองจ่าย (บาท)', 
      dataIndex: 'advanceAmount', 
      key: 'advanceAmount', 
      width: 150, 
      align: 'right', 
      render: (v) => Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }) 
    },
    { 
      title: 'สถานะ', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100, 
      align: 'center',
      render: (v) => (
        <span style={{ color: v === 'ชำระแล้ว' ? '#047857' : '#dc2626', fontWeight: 'bold' }}>
          {v}
        </span>
      )
    }
  ]

  const totalAmount = reportData.reduce((sum, item) => sum + item.advanceAmount, 0)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      
      {/* สไตล์สำหรับการพิมพ์ (Print Style Sheet) ตัวหนังสือมาตรฐาน 11pt พอดีกรอบ ไม่ตกช่อง */}
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
            left: 5mm;
            top: 5mm;
            width: calc(100% - 10mm);
            background: #fff !important;
          }
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .ant-table { font-size: 11pt !important; width: 100% !important; }
          .ant-table-container { border: 1px solid #000 !important; border-radius: 0 !important; background: #fff !important; }
          .ant-table-thead > tr > th { background: #f1f5f9 !important; color: #000 !important; font-weight: bold !important; border-bottom: 1px solid #000 !important; border-right: 1px solid #000 !important; padding: 6px 4px !important; text-align: center !important; }
          .ant-table-tbody > tr > td { border-bottom: 1px solid #000 !important; border-right: 1px solid #000 !important; color: #000 !important; padding: 5px 4px !important; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      <Card 
        title={
          <Space className="no-print">
            <FileTextOutlined style={{ color: primaryColor }} />
            <span>รายงานการชำระเงินทดลองจ่ายรายปี</span>
          </Space>
        }
        style={{ borderRadius: 8, border: `2px solid ${primaryColor}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      >
        <div className="no-print" style={{ background: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={3} style={{ textAlign: 'right' }}><Text strong>กลุ่ม</Text></Col>
            <Col xs={24} sm={5}>
              <Select
                value={groupCode || undefined}
                onChange={(val) => setGroupCode(val || '')}
                placeholder="-- ทุกกลุ่ม --"
                allowClear
                style={{ width: '100%' }}
                options={groupOptions.map(g => ({ value: g, label: g }))}
              />
            </Col>

            <Col xs={24} sm={3} style={{ textAlign: 'right' }}><Text strong>เลขที่สมาชิก</Text></Col>
            <Col xs={24} sm={5}>
              <AutoComplete
                options={memberOptions}
                value={memberId}
                onChange={(val) => setMemberId(val)}
                placeholder="รหัสหรือชื่อสมาชิก"
                style={{ width: '100%' }}
                filterOption={(inputValue, option) =>
                  option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                }
              />
            </Col>

            <Col xs={24} sm={2} style={{ textAlign: 'right' }}><Text strong>ปี</Text></Col>
            <Col xs={24} sm={3}>
              <Select 
                value={selectedYear} 
                onChange={(val) => setSelectedYear(val)}
                style={{ width: '100%' }}
                options={[
                  { value: '2570', label: '2570' },
                  { value: '2569', label: '2569' },
                  { value: '2568', label: '2568' },
                  { value: '2567', label: '2567' },
                ]}
              />
            </Col>

            <Col xs={24} sm={3}>
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={handleSearchData}
                style={{ background: primaryColor, width: '100%' }}
              >
                แสดงข้อมูล
              </Button>
            </Col>
          </Row>
        </div>

        {/* พื้นที่สำหรับพิมพ์รายงาน A4 */}
        <div id="printable-report-area">
          <div className="print-only" style={{ textAlign: 'center', marginBottom: 15 }}>
            <h2 style={{ margin: 0, fontSize: '16pt', fontWeight: 'bold' }}>{orgInfo.name || 'สมาคมฌาปนกิจสงเคราะห์'}</h2>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '12pt', fontWeight: 'normal' }}>รายงานการชำระเงินทดลองจ่ายรายปี (ประจำปี พ.ศ. {selectedYear})</h3>
          </div>

          <div style={{ background: '#fff', borderRadius: 6, overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: 16 }}>
            <Table 
              dataSource={reportData} 
              columns={columns} 
              rowKey="key"
              size="small"
              pagination={false}
              bordered
              locale={{ emptyText: 'ยังไม่มีข้อมูล (กรุณากลอกเงื่อนไขแล้วกด "แสดงข้อมูล")' }}
            />
          </div>
        </div>

        <Row justify="space-between" align="middle" className="no-print">
          <Col>
            <Space size={16}>
              <div>
                <Text strong style={{ marginRight: 8 }}>จำนวน:</Text>
                <Input 
                  value={`${reportData.length} รายการ`} 
                  readOnly 
                  style={{ width: 110, textAlign: 'center', fontWeight: 'bold', background: '#f1f5f9' }} 
                />
              </div>
              <div>
                <Text strong style={{ marginRight: 8 }}>ยอดเงินรวมทั้งสิ้น:</Text>
                <Input 
                  value={totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} 
                  readOnly 
                  style={{ width: 160, textAlign: 'right', fontWeight: 'bold', color: '#047857', background: '#f1f5f9' }} 
                />
              </div>
            </Space>
          </Col>
          <Col className="no-print">
            <Space>
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