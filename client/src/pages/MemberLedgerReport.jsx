import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Radio, Button, Typography, Row, Col, Input, Select, Table, Space, message, AutoComplete } from 'antd'
import { PrinterOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const { Text } = Typography

export default function MemberLedgerReport() {
  const { theme } = useOutletContext() || {}

  // ดึงข้อมูลหน่วยงานจาก localStorage จริง
  const [orgInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('funeral_organization_info')) || {}
    } catch {
      return {}
    }
  })

  const [printType, setPrintType] = useState('individual')
  const [memberId, setMemberId] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  const [selectedYear, setSelectedYear] = useState(String(dayjs().year() + 543))
  const [groupCode, setGroupCode] = useState('')

  const [broughtForwardBalance, setBroughtForwardBalance] = useState(0)
  const [broughtForwardArrears, setBroughtForwardArrears] = useState(0)
  const [ledgerTransactions, setLedgerTransactions] = useState([])
  const [memberOptions, setMemberOptions] = useState([])

  // โหลดรายชื่อสมาชิกจาก funeral_members จริง
  useEffect(() => {
    try {
      const members = JSON.parse(localStorage.getItem('funeral_members')) || []
      const options = members.map(m => {
        const id = String(m.id || m.memberId || '')
        const name = m.name || m.fullname || `${m.prefix || ''}${m.firstName || ''} ${m.lastName || ''}`.trim()
        return {
          value: id,
          label: `${id} - ${name}`
        }
      })
      setMemberOptions(options)
    } catch (e) {
      console.error(e)
    }
  }, [])

  // ค้นหาข้อมูลสมาชิกและซิงค์ข้อมูลจากทุกแหล่งใน localStorage
  const handleSearchMember = (targetId = memberId) => {
    if (!targetId) {
      message.warning('กรุณากรอกรหัสสมาชิกที่ต้องการค้นหา')
      return
    }

    try {
      const members = JSON.parse(localStorage.getItem('funeral_members')) || []
      const found = members.find(m => String(m.id || m.memberId) === String(targetId))

      if (!found) {
        message.error(`ไม่พบสมาชิกรหัส: ${targetId} ในระบบ`)
        setSelectedMember(null)
        setLedgerTransactions([])
        setBroughtForwardBalance(0)
        setBroughtForwardArrears(0)
        setGroupCode('')
        return
      }

      setSelectedMember(found)
      setGroupCode(found.group || found.groupId || found.village || found.moo || '-')

      // 1. ดึงข้อมูลยอดคงเหลือยกมา/ค้างชำระยกมาข้ามปีจาก funeral_advance_payments (ถ้ามีตามปีที่เลือก)
      const advancePayments = JSON.parse(localStorage.getItem('funeral_advance_payments')) || []
      const foundAdvance = advancePayments.find(
        item => String(item.memberId) === String(targetId) && String(item.year) === String(selectedYear)
      )

      let bfBalance = 0
      let bfArrears = 0

      if (foundAdvance) {
        bfBalance = Number(foundAdvance.balanceForward || 0)
        bfArrears = Number(foundAdvance.arrears || 0)
      } else {
        // Fallback จากข้อมูลในตัวสมาชิกเอง
        bfBalance = Number(found.balance !== undefined ? found.balance : (found.advance !== undefined ? found.advance : 0))
        bfArrears = Number(found.arrears || found.debt || 0)
      }

      setBroughtForwardBalance(bfBalance >= 0 ? bfBalance : 0)
      setBroughtForwardArrears(bfArrears)

      // 2. ดึงประวัติใบเสร็จจาก funeral_receipts หรือ receipts จริง
      const receipts = JSON.parse(localStorage.getItem('funeral_receipts')) || JSON.parse(localStorage.getItem('receipts')) || []
      const memberReceipts = receipts.filter(r => {
        const matchId = String(r.memberId || r.id || r.member_id) === String(targetId)
        if (r.date) {
          const receiptYear = String(dayjs(r.date).year() + 543)
          return matchId && receiptYear === String(selectedYear)
        }
        return matchId
      })

      let runningBalance = bfBalance >= 0 ? bfBalance : 0
      const txs = memberReceipts.map((r, idx) => {
        const advanceAmt = Number(r.advance || r.advanceAmount || 0)
        const welfareAmt = Number(r.welfare || r.welfareAmount || 0)
        const registerAmt = Number(r.register || r.registerFee || 0)
        const maintAmt = Number(r.maintenance || r.maintenanceFee || 0)
        const donateAmt = Number(r.donate || r.donation || 0)
        const otherAmt = Number(r.other || 0)
        
        const paidAmount = Number(r.total || r.grandTotal || (advanceAmt + welfareAmt + registerAmt + maintAmt + donateAmt + otherAmt) || 0)
        
        runningBalance += paidAmount

        let detailsArr = []
        if (advanceAmt > 0) detailsArr.push(`สงเคราะห์ล่วงหน้า: ${advanceAmt.toLocaleString()} ฿`)
        if (welfareAmt > 0) detailsArr.push(`สงเคราะห์: ${welfareAmt.toLocaleString()} ฿`)
        if (registerAmt > 0) detailsArr.push(`ค่าสมัคร: ${registerAmt.toLocaleString()} ฿`)
        if (maintAmt > 0) detailsArr.push(`ค่าบำรุง: ${maintAmt.toLocaleString()} ฿`)
        if (donateAmt > 0) detailsArr.push(`บริจาค: ${donateAmt.toLocaleString()} ฿`)
        if (otherAmt > 0) detailsArr.push(`อื่นๆ: ${otherAmt.toLocaleString()} ฿`)

        const detailText = detailsArr.length > 0 ? detailsArr.join(', ') : (r.detail || r.note || 'ชำระเงินสงเคราะห์ / บำรุงประจำปี')

        return {
          key: r.docNo || idx + 1,
          no: idx + 1,
          date: r.date ? dayjs(r.date).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY'),
          receiptNo: r.docNo || r.receiptNo || r.no || `REC-${idx + 1}`,
          detail: detailText,
          debit: 0,
          credit: paidAmount,
          balance: runningBalance
        }
      })

      setLedgerTransactions(txs)
      message.success('ซิงค์ข้อมูลทะเบียนรับ-จ่ายจากทุกโมดูลสำเร็จ')
    } catch (e) {
      console.error(e)
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    }
  }

  const getMemberFullName = (m) => {
    if (!m) return ''
    if (m.name) return m.name
    if (m.fullname) return m.fullname
    const prefix = m.prefix || ''
    const firstName = m.firstName || m.firstname || ''
    const lastName = m.lastName || m.lastname || ''
    return `${prefix}${firstName} ${lastName}`.trim()
  }

  const columns = [
    { title: 'งวด/ครั้ง', dataIndex: 'no', key: 'no', width: 55, align: 'center' },
    { title: 'วันที่', dataIndex: 'date', key: 'date', width: 90, align: 'center' },
    { title: 'เลขที่ใบเสร็จ', dataIndex: 'receiptNo', key: 'receiptNo', width: 100, align: 'center' },
    { title: 'รายการ / รายละเอียด', dataIndex: 'detail', key: 'detail' },
    { title: 'รายจ่าย', dataIndex: 'debit', key: 'debit', width: 85, align: 'right', render: (v) => v > 0 ? Number(v).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-' },
    { title: 'รายรับ', dataIndex: 'credit', key: 'credit', width: 85, align: 'right', render: (v) => v > 0 ? Number(v).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-' },
    { title: 'ยอดคงเหลือ', dataIndex: 'balance', key: 'balance', width: 100, align: 'right', render: (v) => Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }) }
  ]

  const totalCredit = ledgerTransactions.reduce((sum, item) => sum + item.credit, 0)
  const totalDebit = ledgerTransactions.reduce((sum, item) => sum + item.debit, 0)
  const finalBalance = broughtForwardBalance + totalCredit - totalDebit

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', padding: 16 }}>
      
      {/* สไตล์สำหรับการพิมพ์ (Print Style Sheet) ขนาดตัวหนังสือมาตรฐาน 11pt พอดีกรอบ ไม่ตกช่อง */}
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
        title="ทะเบียนสมาชิกรายตัว/ตามกลุ่ม"
        bodyStyle={{ background: '#bae6fd', padding: 16, borderRadius: 8 }}
        style={{ borderRadius: 10, border: '2px solid #0284c7', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      >
        {/* ฟอร์มตัวเลือก (ซ่อนตอนพิมพ์) */}
        <div className="no-print" style={{ background: '#e0f2fe', padding: 12, borderRadius: 6, marginBottom: 12, border: '1px solid #7dd3fc' }}>
          <Space size={24} style={{ marginBottom: 12, display: 'flex' }}>
            <Text strong style={{ color: '#0369a1' }}>เงื่อนไขพิมพ์</Text>
            <Radio.Group value={printType} onChange={(e) => setPrintType(e.target.value)}>
              <Radio value="individual"><Text strong>พิมพ์รายตัว</Text></Radio>
              <Radio value="group"><Text strong>พิมพ์ตามกลุ่ม</Text></Radio>
            </Radio.Group>
          </Space>

          <Row gutter={[12, 12]} align="middle">
            <Col span={3}><Text strong style={{ color: '#0369a1' }}>รหัสสมาชิก</Text></Col>
            <Col span={6}>
              <AutoComplete
                options={memberOptions}
                value={memberId}
                onChange={(val) => {
                  setMemberId(val)
                  handleSearchMember(val)
                }}
                onSelect={(val) => {
                  setMemberId(val)
                  handleSearchMember(val)
                }}
                placeholder="พิมพ์รหัสหรือชื่อ"
                style={{ width: '100%' }}
                filterOption={(inputValue, option) =>
                  option.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
                }
              />
            </Col>
            <Col span={1}>
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={() => handleSearchMember(memberId)}
                style={{ background: '#0284c7' }}
              />
            </Col>

            <Col span={3} style={{ textAlign: 'right' }}><Text strong style={{ color: '#0369a1' }}>ชื่อนามสกุล</Text></Col>
            <Col span={7}>
              <Input 
                value={selectedMember ? getMemberFullName(selectedMember) : ''} 
                readOnly 
                placeholder="" 
                style={{ background: '#fff', fontWeight: 'bold' }} 
              />
            </Col>

            <Col span={1} style={{ textAlign: 'right' }}><Text strong style={{ color: '#0369a1' }}>ปี</Text></Col>
            <Col span={3}>
              <Select 
                value={selectedYear} 
                onChange={(val) => {
                  setSelectedYear(val)
                  if (memberId) handleSearchMember(memberId)
                }}
                style={{ width: '100%' }}
                options={[
                  { value: '2570', label: '2570' },
                  { value: '2569', label: '2569' },
                  { value: '2568', label: '2568' },
                  { value: '2567', label: '2567' },
                ]}
              />
            </Col>

            <Col span={3}><Text strong style={{ color: '#0369a1' }}>กลุ่ม</Text></Col>
            <Col span={5}>
              <Input value={groupCode} readOnly style={{ background: '#fff' }} />
            </Col>

            <Col span={4} style={{ textAlign: 'right' }}><Text strong style={{ color: '#0369a1' }}>ยอดคงเหลือยกมา</Text></Col>
            <Col span={5}>
              <Input value={broughtForwardBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })} readOnly style={{ textAlign: 'right', background: '#fff', fontWeight: 'bold' }} />
            </Col>

            <Col span={3} style={{ textAlign: 'right' }}><Text strong style={{ color: '#0369a1' }}>ยอดค้างชำระยกมา</Text></Col>
            <Col span={4}>
              <Input value={broughtForwardArrears.toLocaleString('th-TH', { minimumFractionDigits: 2 })} readOnly style={{ textAlign: 'right', background: '#fff', fontWeight: 'bold', color: '#dc2626' }} />
            </Col>
          </Row>
        </div>

        {/* พื้นที่สำหรับพิมพ์รายงาน A4 */}
        <div id="printable-report-area">
          {/* หัวกระดาษที่จะแสดงเฉพาะตอนพิมพ์ออกเครื่องพิมพ์ */}
          <div className="print-only" style={{ textAlign: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: '16pt', fontWeight: 'bold' }}>{orgInfo.name || 'สมาคมฌาปนกิจสงเคราะห์'}</h2>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '12pt', fontWeight: 'normal' }}>ทะเบียนรับ-จ่ายสมาชิกรายตัว (ประจำปี พ.ศ. {selectedYear})</h3>
            {selectedMember && (
              <p style={{ margin: '4px 0 0 0', fontSize: '11pt' }}>
                รหัสสมาชิก: <b>{selectedMember.id || selectedMember.memberId}</b> | ชื่อ-นามสกุล: <b>{getMemberFullName(selectedMember)}</b> | กลุ่ม: <b>{groupCode}</b>
              </p>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #7dd3fc', marginBottom: 16 }}>
            <Table 
              dataSource={ledgerTransactions} 
              columns={columns} 
              rowKey="key"
              size="small"
              pagination={false}
              bordered
              locale={{ emptyText: 'กรุณาค้นหารหัสสมาชิกเพื่อแสดงประวัติทะเบียนรับ-จ่าย' }}
            />
          </div>
        </div>

        {/* แถบควบคุมและยอดสรุปด้านล่าง (ซ่อนตอนพิมพ์) */}
        <Row className="no-print" justify="space-between" align="middle" style={{ marginTop: 8 }}>
          <Col>
            <Space size={16}>
              <div>
                <Text strong style={{ marginRight: 8 }}>ยอดคงเหลือ:</Text>
                <Input 
                  value={finalBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })} 
                  readOnly 
                  style={{ width: 140, textAlign: 'right', fontWeight: 'bold', color: '#047857', background: '#fff' }} 
                />
              </div>
              <div>
                <Text strong style={{ marginRight: 8 }}>ยอดต้องชำระ:</Text>
                <Input 
                  value={broughtForwardArrears.toLocaleString('th-TH', { minimumFractionDigits: 2 })} 
                  readOnly 
                  style={{ width: 140, textAlign: 'right', fontWeight: 'bold', color: '#dc2626', background: '#fff' }} 
                />
              </div>
            </Space>
          </Col>
          <Col>
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