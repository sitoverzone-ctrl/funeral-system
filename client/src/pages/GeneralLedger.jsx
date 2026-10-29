import React, { useState, useEffect } from 'react'
import { useOutletContext, useLocation } from 'react-router-dom'
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Typography, 
  DatePicker, 
  Space, 
  Tag,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Popconfirm 
} from 'antd'
import { 
  BookOutlined, 
  DollarOutlined, 
  BankOutlined, 
  WalletOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

export default function GeneralLedger() {
  const outletContext = useOutletContext()
  const theme = outletContext?.theme || { primary: '#1f3a8a' }
  const primaryColor = theme.primary || '#1f3a8a'
  const location = useLocation()

  // ตรวจสอบสิทธิ์ (Manager หรือ Dev เท่านั้นถึงมีสิทธิ์แก้ไข/ลบ)
  const user = outletContext?.user || { role: 'staff' }
  const canManage = user.role === 'manager' || user.role === 'dev'

  const isAccount88 = location.pathname.includes('88')

  const [receipts, setReceipts] = useState([])
  const [selectedDate, setSelectedDate] = useState(dayjs())
  
  // บัญชี 88 States
  const [deposits88, setDeposits88] = useState({})
  const [isCustomModalOpen88, setIsCustomModalOpen88] = useState(false)
  const [isEditModalOpen88, setIsEditModalOpen88] = useState(false)
  const [editingIndex88, setEditingIndex88] = useState(null)
  const [customForm88] = Form.useForm()
  const [editForm88] = Form.useForm()

  // บัญชี 87 States
  const [actions87, setActions87] = useState({})
  const [isCustomModalOpen87, setIsCustomModalOpen87] = useState(false)
  const [modalType87, setModalType87] = useState('BANK')
  const [isEditModalOpen87, setIsEditModalOpen87] = useState(false)
  const [editingIndex87, setEditingIndex87] = useState(null)
  const [customForm87] = Form.useForm()
  const [editForm87] = Form.useForm()

  // โหลดข้อมูลใบเสร็จจริงจาก localStorage เพื่อให้ลิงก์อัตโนมัติ
  useEffect(() => {
    const loadData = () => {
      const savedReceipts = JSON.parse(localStorage.getItem('funeral_receipts')) || []
      setReceipts(savedReceipts)

      const savedDeposits88 = JSON.parse(localStorage.getItem('funeral_bank_deposits_88')) || {}
      setDeposits88(savedDeposits88)

      const savedActions87 = JSON.parse(localStorage.getItem('funeral_actions_87')) || {}
      setActions87(savedActions87)
    }

    loadData()
    // เพิ่ม Event Listener เพื่อให้อัปเดตข้อมูลทันทีที่มีการบันทึกใบเสร็จใหม่
    window.addEventListener('storage', loadData)
    return () => window.removeEventListener('storage', loadData)
  }, [])

  const targetDateStr = selectedDate.format('YYYY-MM-DD')
  
  // กรองใบเสร็จตามวันที่เลือก (ลิงก์ตรงกับหน้าออกใบเสร็จ)
  const filteredReceipts = receipts.filter(item => item.date === targetDateStr)

  // ==================== บัญชี 88 (สงเคราะห์ศพ & ล่วงหน้า) ====================
  const receipts88 = filteredReceipts.filter(item => (Number(item.advance || 0) + Number(item.welfare || 0)) > 0)
  const totalAdvance88 = receipts88.reduce((sum, item) => sum + Number(item.advance || 0), 0)
  const totalWelfare88 = receipts88.reduce((sum, item) => sum + Number(item.welfare || 0), 0)
  const grandTotal88 = totalAdvance88 + totalWelfare88 // ยอดรวมจริงจากใบเสร็จ

  const depositRecord88 = deposits88[targetDateStr] || { amount: 0, status: false, history: [] }
  const alreadyDepositedAmount88 = depositRecord88.amount || 0
  const remainingToDeposit88 = Math.max(0, grandTotal88 - alreadyDepositedAmount88)

  const saveDepositToStorage88 = (addAmount) => {
    const newTotal = alreadyDepositedAmount88 + addAmount
    const currentHistory = depositRecord88.history || []
    
    const updated = {
      ...deposits88,
      [targetDateStr]: {
        date: targetDateStr,
        amount: newTotal,
        status: true,
        history: [{ time: dayjs().format('HH:mm:ss'), amount: addAmount }, ...currentHistory]
      }
    }
    setDeposits88(updated)
    localStorage.setItem('funeral_bank_deposits_88', JSON.stringify(updated))
    
    const currentBankTotal = Number(localStorage.getItem('funeral_total_bank_balance_88') || 0)
    localStorage.setItem('funeral_total_bank_balance_88', (currentBankTotal + addAmount).toString())
  }

  const handleDepositFull88 = () => {
    if (remainingToDeposit88 <= 0) return
    saveDepositToStorage88(remainingToDeposit88)
    message.success(`นำฝากบัญชี 88 เพิ่ม ${remainingToDeposit88.toLocaleString()} บาท เรียบร้อย`)
  }

  const handleCustomSubmit88 = (values) => {
    const amt = Number(values.customAmount || 0)
    if (amt <= 0 || amt > remainingToDeposit88) {
      message.error('จำนวนเงินไม่ถูกต้อง')
      return
    }
    saveDepositToStorage88(amt)
    message.success(`บันทึกฝากบัญชี 88 จำนวน ${amt.toLocaleString()} บาท เรียบร้อย`)
    setIsCustomModalOpen88(false)
    customForm88.resetFields()
  }

  const handleEditHistorySubmit88 = (values) => {
    if (!canManage) {
      message.error('เฉพาะ Manager หรือ Dev เท่านั้นที่มีสิทธิ์แก้ไขรายการ!')
      return
    }
    const newAmt = Number(values.editAmount || 0)
    const currentHistory = [...(depositRecord88.history || [])]
    const targetItem = currentHistory[editingIndex88]
    if (!targetItem) return

    const oldAmt = targetItem.amount
    const diff = newAmt - oldAmt

    if ((alreadyDepositedAmount88 + diff) > grandTotal88) {
      message.error('ยอดเงินรวมที่ฝากเกินกว่ายอดรับจริงในระบบ!')
      return
    }

    currentHistory[editingIndex88] = { ...targetItem, amount: newAmt }
    const newTotalAmount = Math.max(0, alreadyDepositedAmount88 + diff)

    const updated = {
      ...deposits88,
      [targetDateStr]: {
        date: targetDateStr,
        amount: newTotalAmount,
        status: newTotalAmount > 0,
        history: currentHistory
      }
    }
    setDeposits88(updated)
    localStorage.setItem('funeral_bank_deposits_88', JSON.stringify(updated))

    const currentBankTotal = Number(localStorage.getItem('funeral_total_bank_balance_88') || 0)
    localStorage.setItem('funeral_total_bank_balance_88', Math.max(0, currentBankTotal + diff).toString())

    message.success('แก้ไขรายการฝากเรียบร้อย (อัปเดตยอดเงินหลักแล้ว)')
    setIsEditModalOpen88(false)
    setEditingIndex88(null)
  }

  const handleDeleteHistory88 = (index) => {
    if (!canManage) {
      message.error('เฉพาะผู้จัดการ (Manager) หรือ Dev เท่านั้นที่มีสิทธิ์ลบรายการ!')
      return
    }

    const currentHistory = [...(depositRecord88.history || [])]
    const targetItem = currentHistory[index]
    if (!targetItem) return
    const subAmount = targetItem.amount

    currentHistory.splice(index, 1)
    const newTotalAmount = Math.max(0, alreadyDepositedAmount88 - subAmount)

    const updated = {
      ...deposits88,
      [targetDateStr]: {
        date: targetDateStr,
        amount: newTotalAmount,
        status: newTotalAmount > 0,
        history: currentHistory
      }
    }
    setDeposits88(updated)
    localStorage.setItem('funeral_bank_deposits_88', JSON.stringify(updated))

    const currentBankTotal = Number(localStorage.getItem('funeral_total_bank_balance_88') || 0)
    localStorage.setItem('funeral_total_bank_balance_88', Math.max(0, currentBankTotal - subAmount).toString())

    message.success('ลบรายการฝากเรียบร้อย (คืนยอดเงินหลักเรียบร้อยแล้ว)')
  }


  // ==================== บัญชี 87 (ค่าบำรุง / บริหาร) ====================
  const receipts87 = filteredReceipts.filter(item => (
    Number(item.register || 0) + 
    Number(item.maintenance || 0) + 
    Number(item.discount || 0) + 
    Number(item.donate || 0) + 
    Number(item.other || 0)
  ) > 0)

  const totalRegister87 = receipts87.reduce((sum, item) => sum + Number(item.register || 0), 0)
  const totalMaintenance87 = receipts87.reduce((sum, item) => sum + Number(item.maintenance || 0), 0)
  const totalDiscount87 = receipts87.reduce((sum, item) => sum + Number(item.discount || 0), 0)
  const totalDonate87 = receipts87.reduce((sum, item) => sum + Number(item.donate || 0), 0)
  const totalOther87 = receipts87.reduce((sum, item) => sum + Number(item.other || 0), 0)
  const grandTotal87 = totalRegister87 + totalMaintenance87 + totalDiscount87 + totalDonate87 + totalOther87 // ยอดรวมจริงจากใบเสร็จ

  const record87 = actions87[targetDateStr] || { depositedBank: 0, cashOnHand: 0, history: [] }
  const alreadyBank87 = record87.depositedBank || 0
  const alreadyCash87 = record87.cashOnHand || 0
  const handledTotal87 = alreadyBank87 + alreadyCash87
  const remainingToHandle87 = Math.max(0, grandTotal87 - handledTotal87)

  const saveActionToStorage87 = (addAmount, type) => {
    const newBank = type === 'BANK' ? alreadyBank87 + addAmount : alreadyBank87
    const newCash = type === 'CASH' ? alreadyCash87 + addAmount : alreadyCash87
    const currentHistory = record87.history || []

    const updated = {
      ...actions87,
      [targetDateStr]: {
        date: targetDateStr,
        depositedBank: newBank,
        cashOnHand: newCash,
        history: [{ time: dayjs().format('HH:mm:ss'), type, amount: addAmount }, ...currentHistory]
      }
    }
    setActions87(updated)
    localStorage.setItem('funeral_actions_87', JSON.stringify(updated))

    if (type === 'BANK') {
      const currentBankTotal87 = Number(localStorage.getItem('funeral_total_bank_balance_87') || 0)
      localStorage.setItem('funeral_total_bank_balance_87', (currentBankTotal87 + addAmount).toString())
    } else {
      const currentCashTotal = Number(localStorage.getItem('funeral_total_cash_balance') || 0)
      localStorage.setItem('funeral_total_cash_balance', (currentCashTotal + addAmount).toString())
    }
  }

  const handleActionFull87 = (type) => {
    if (remainingToHandle87 <= 0) return
    saveActionToStorage87(remainingToHandle87, type)
    message.success(type === 'BANK' ? `ฝากธนาคาร บัญชี 87 เพิ่ม ${remainingToHandle87.toLocaleString()} บาท เรียบร้อย` : `เก็บเงินสดในมือ บัญชี 87 เพิ่ม ${remainingToHandle87.toLocaleString()} บาท เรียบร้อย`)
  }

  const handleCustomSubmit87 = (values) => {
    const amt = Number(values.customAmount || 0)
    if (amt <= 0 || amt > remainingToHandle87) {
      message.error('จำนวนเงินไม่ถูกต้อง')
      return
    }
    saveActionToStorage87(amt, modalType87)
    message.success(modalType87 === 'BANK' ? `ฝากธนาคาร บัญชี 87 จำนวน ${amt.toLocaleString()} บาท เรียบร้อย` : `เก็บเงินสดในมือ บัญชี 87 จำนวน ${amt.toLocaleString()} บาท เรียบร้อย`)
    setIsCustomModalOpen87(false)
    customForm87.resetFields()
  }

  const handleEditHistorySubmit87 = (values) => {
    if (!canManage) {
      message.error('เฉพาะ Manager หรือ Dev เท่านั้นที่มีสิทธิ์แก้ไขรายการ!')
      return
    }
    const newAmt = Number(values.editAmount || 0)
    const newType = values.editType
    const currentHistory = [...(record87.history || [])]
    const targetItem = currentHistory[editingIndex87]
    if (!targetItem) return

    const oldAmt = targetItem.amount
    const oldType = targetItem.type

    currentHistory[editingIndex87] = { ...targetItem, amount: newAmt, type: newType }

    let newBank = alreadyBank87
    let newCash = alreadyCash87

    if (oldType === newType) {
      const diff = newAmt - oldAmt
      if (oldType === 'BANK') newBank += diff; else newCash += diff
    } else {
      if (oldType === 'BANK') { newBank -= oldAmt; newCash += newAmt } 
      else { newCash -= oldAmt; newBank += newAmt }
    }

    if (newBank < 0 || newCash < 0 || (newBank + newCash) > grandTotal87) {
      message.error('ยอดเงินไม่ถูกต้องหรือเกินวงเงินรับจริง!')
      return
    }

    const updated = {
      ...actions87,
      [targetDateStr]: {
        date: targetDateStr,
        depositedBank: newBank,
        cashOnHand: newCash,
        history: currentHistory
      }
    }
    setActions87(updated)
    localStorage.setItem('funeral_actions_87', JSON.stringify(updated))

    if (oldType === newType) {
      const diff = newAmt - oldAmt
      if (oldType === 'BANK') {
        const cur = Number(localStorage.getItem('funeral_total_bank_balance_87') || 0)
        localStorage.setItem('funeral_total_bank_balance_87', Math.max(0, cur + diff).toString())
      } else {
        const cur = Number(localStorage.getItem('funeral_total_cash_balance') || 0)
        localStorage.setItem('funeral_total_cash_balance', Math.max(0, cur + diff).toString())
      }
    } else {
      if (oldType === 'BANK') {
        const curBank = Number(localStorage.getItem('funeral_total_bank_balance_87') || 0)
        localStorage.setItem('funeral_total_bank_balance_87', Math.max(0, curBank - oldAmt).toString())
        const curCash = Number(localStorage.getItem('funeral_total_cash_balance') || 0)
        localStorage.setItem('funeral_total_cash_balance', (curCash + newAmt).toString())
      } else {
        const curCash = Number(localStorage.getItem('funeral_total_cash_balance') || 0)
        localStorage.setItem('funeral_total_cash_balance', Math.max(0, curCash - oldAmt).toString())
        const curBank = Number(localStorage.getItem('funeral_total_bank_balance_87') || 0)
        localStorage.setItem('funeral_total_bank_balance_87', (curBank + newAmt).toString())
      }
    }

    message.success('แก้ไขรายการเรียบร้อย (อัปเดตยอดเงินหลักแล้ว)')
    setIsEditModalOpen87(false)
    setEditingIndex87(null)
  }

  const handleDeleteHistory87 = (index) => {
    if (!canManage) {
      message.error('เฉพาะผู้จัดการ (Manager) หรือ Dev เท่านั้นที่มีสิทธิ์ลบรายการ!')
      return
    }

    const currentHistory = [...(record87.history || [])]
    const targetItem = currentHistory[index]
    if (!targetItem) return
    const type = targetItem.type
    const subAmount = targetItem.amount

    currentHistory.splice(index, 1)
    
    const newBank = type === 'BANK' ? Math.max(0, alreadyBank87 - subAmount) : alreadyBank87
    const newCash = type === 'CASH' ? Math.max(0, alreadyCash87 - subAmount) : alreadyCash87

    const updated = {
      ...actions87,
      [targetDateStr]: {
        date: targetDateStr,
        depositedBank: newBank,
        cashOnHand: newCash,
        history: currentHistory
      }
    }
    setActions87(updated)
    localStorage.setItem('funeral_actions_87', JSON.stringify(updated))

    if (type === 'BANK') {
      const currentBankTotal87 = Number(localStorage.getItem('funeral_total_bank_balance_87') || 0)
      localStorage.setItem('funeral_total_bank_balance_87', Math.max(0, currentBankTotal87 - subAmount).toString())
    } else {
      const currentCashTotal = Number(localStorage.getItem('funeral_total_cash_balance') || 0)
      localStorage.setItem('funeral_total_cash_balance', Math.max(0, currentCashTotal - subAmount).toString())
    }

    message.success('ลบรายการเรียบร้อย (คืนยอดเงินหลักเรียบร้อยแล้ว)')
  }


  // Columns ตารางทั่วไป
  const columns88 = [
    { title: 'เลขที่ใบเสร็จ', dataIndex: 'docNo', key: 'docNo', width: 110 },
    { title: 'รหัสสมาชิก', dataIndex: 'memberId', key: 'memberId', width: 90 },
    { title: 'ชื่อ-นามสกุล', dataIndex: 'memberName', key: 'memberName' },
    { title: 'เงินสงเคราะห์รับล่วงหน้า', dataIndex: 'advance', key: 'advance', align: 'right', render: (v) => `${Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿` },
    { title: 'เงินสงเคราะห์ศพ', dataIndex: 'welfare', key: 'welfare', align: 'right', render: (v) => `${Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿` },
    { title: 'รวมบัญชี 88', key: 'total', align: 'right', render: (_, record) => `${(Number(record.advance || 0) + Number(record.welfare || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿` },
  ]

  const historyColumns88 = [
    { title: 'เวลาที่ทำรายการ', dataIndex: 'time', key: 'time' },
    { title: 'จำนวนเงินที่ฝากธนาคาร', dataIndex: 'amount', key: 'amount', align: 'right', render: (v) => <Text type="success" strong>+ {Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</Text> },
    { 
      title: 'จัดการรายการ', 
      key: 'action', 
      align: 'center',
      width: 180,
      render: (_, record, index) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            size="small"
            disabled={!canManage}
            onClick={() => {
              setEditingIndex88(index)
              editForm88.setFieldsValue({ editAmount: record.amount })
              setIsEditModalOpen88(true)
            }}
          >
            แก้ไข
          </Button>
          <Popconfirm
            title="ลบรายการฝากนี้?"
            description="ยอดเงินจะถูกหักออกจากยอดหลัก"
            onConfirm={() => handleDeleteHistory88(index)}
            okText="ยืนยันลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true, disabled: !canManage }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">ลบ</Button>
          </Popconfirm>
        </Space>
      ) 
    }
  ]

  const columns87 = [
    { title: 'เลขที่ใบเสร็จ', dataIndex: 'docNo', key: 'docNo', width: 110 },
    { title: 'รหัสสมาชิก', dataIndex: 'memberId', key: 'memberId', width: 90 },
    { title: 'ค่าสมัคร', dataIndex: 'register', key: 'register', align: 'right', render: (v) => `${Number(v || 0).toLocaleString()} ฿` },
    { title: 'ค่าบำรุง', dataIndex: 'maintenance', key: 'maintenance', align: 'right', render: (v) => `${Number(v || 0).toLocaleString()} ฿` },
    { title: 'หักเปอร์เซ็นต์', dataIndex: 'discount', key: 'discount', align: 'right', render: (v) => `${Number(v || 0).toLocaleString()} ฿` },
    { title: 'เงินบริจาค', dataIndex: 'donate', key: 'donate', align: 'right', render: (v) => `${Number(v || 0).toLocaleString()} ฿` },
    { title: 'อื่นๆ', dataIndex: 'other', key: 'other', align: 'right', render: (v) => `${Number(v || 0).toLocaleString()} ฿` },
    { title: 'รวมบัญชี 87', key: 'total', align: 'right', render: (_, record) => `${(Number(record.register || 0) + Number(record.maintenance || 0) + Number(record.discount || 0) + Number(record.donate || 0) + Number(record.other || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿` },
  ]

  const historyColumns87 = [
    { title: 'เวลาที่ทำรายการ', dataIndex: 'time', key: 'time' },
    { title: 'ประเภทการจัดการ', dataIndex: 'type', key: 'type', render: (v) => <Tag color={v === 'BANK' ? 'blue' : 'green'}>{v === 'BANK' ? 'ฝากธนาคาร' : 'เก็บเงินสดในมือ'}</Tag> },
    { title: 'จำนวนเงิน', dataIndex: 'amount', key: 'amount', align: 'right', render: (v) => <Text type="success" strong>+ {Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</Text> },
    { 
      title: 'จัดการรายการ', 
      key: 'action', 
      align: 'center',
      width: 180,
      render: (_, record, index) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            size="small"
            disabled={!canManage}
            onClick={() => {
              setEditingIndex87(index)
              editForm87.setFieldsValue({ editAmount: record.amount, editType: record.type })
              setIsEditModalOpen87(true)
            }}
          >
            แก้ไข
          </Button>
          <Popconfirm
            title="ลบรายการนี้?"
            description="ยอดเงินจะถูกหักออกจากยอดหลัก"
            onConfirm={() => handleDeleteHistory87(index)}
            okText="ยืนยันลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true, disabled: !canManage }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">ลบ</Button>
          </Popconfirm>
        </Space>
      ) 
    }
  ]

  return (
    <div style={{ maxWidth: 1250, margin: '0 auto', background: '#f1f5f9', padding: 16, borderRadius: 12, border: '1px solid #cbd5e1' }}>
      
      <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #cbd5e1', borderLeft: `4px solid ${primaryColor}` }}>
        <Space>
          <BookOutlined style={{ color: primaryColor, fontSize: 20 }} />
          <Title level={4} style={{ margin: 0, color: primaryColor, fontWeight: 'bold' }}>
            สมุดบัญชีแยกประเภท (General Ledger) — บัญชี {isAccount88 ? '88 (สงเคราะห์ศพ & ล่วงหน้า)' : '87 (ค่าบำรุง / บริหาร)'} ประจำวัน
          </Title>
        </Space>
        <Space>
          <Text strong><CalendarOutlined /> เลือกวันที่รายงาน:</Text>
          <DatePicker 
            value={selectedDate} 
            onChange={(date) => date && setSelectedDate(date)} 
            format="DD / MM / YYYY" 
            style={{ fontWeight: 'bold' }}
          />
        </Space>
      </div>

      {isAccount88 ? (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #2563eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Statistic 
                  title={<Text strong style={{ color: '#1d4ed8' }}>ยอดคงเหลือต้องนำฝากวันนี้</Text>} 
                  value={remainingToDeposit88} 
                  precision={2} 
                  suffix="บาท" 
                  valueStyle={{ color: '#1d4ed8', fontWeight: 'bold' }}
                  prefix={<BankOutlined />}
                />
                <Tag color="blue" style={{ marginTop: 6 }}>จากยอดรวมระบบ {grandTotal88.toLocaleString()} ฿</Tag>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #16a34a', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Statistic 
                  title={<Text strong style={{ color: '#15803d' }}>นำฝากไปแล้ววันนี้</Text>} 
                  value={alreadyDepositedAmount88} 
                  precision={2} 
                  suffix="บาท" 
                  valueStyle={{ color: '#15803d', fontWeight: 'bold' }}
                  prefix={<CheckCircleOutlined />}
                />
                <Tag color="green" style={{ marginTop: 6 }}>ส่งยอดรวมไป Dashboard แล้ว</Tag>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #8b5cf6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Statistic 
                  title={<Text strong style={{ color: '#7c3aed' }}>เงินสงเคราะห์ศพ / ล่วงหน้า</Text>} 
                  value={grandTotal88} 
                  precision={2} 
                  suffix="บาท" 
                  valueStyle={{ color: '#7c3aed', fontWeight: 'bold' }}
                />
                <Tag color="purple" style={{ marginTop: 6 }}>ยอดรับเงินจากใบเสร็จจริง</Tag>
              </Card>
            </Col>
          </Row>

          <Card size="small" style={{ marginBottom: 16, borderRadius: 8, background: remainingToDeposit88 === 0 ? '#f0fdf4' : '#eff6ff', border: `1px solid ${remainingToDeposit88 === 0 ? '#bbf7d0' : '#bfdbfe'}` }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  {remainingToDeposit88 === 0 ? <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 20 }} /> : <BankOutlined style={{ color: primaryColor, fontSize: 20 }} />}
                  <div>
                    <Text strong style={{ fontSize: 14, color: remainingToDeposit88 === 0 ? '#15803d' : '#1e3a8a' }}>
                      {remainingToDeposit88 === 0 ? 'นำเงินฝากธนาคารครบตามยอดประจำวันเรียบร้อยแล้ว' : `ยังมียอดค้างนำฝากอีก ${remainingToDeposit88.toLocaleString()} บาท`}
                    </Text>
                    <div style={{ fontSize: 12, color: '#64748b' }}>ฝากแล้วสะสมวันนี้: <b>{alreadyDepositedAmount88.toLocaleString()} บาท</b></div>
                  </div>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button 
                    icon={<EditOutlined />}
                    disabled={remainingToDeposit88 <= 0}
                    onClick={() => {
                      customForm88.setFieldsValue({ customAmount: remainingToDeposit88 })
                      setIsCustomModalOpen88(true)
                    }}
                    style={{ fontWeight: '600', height: 40 }}
                  >
                    ✏️ ฝากระบุยอดเอง
                  </Button>
                  <Button 
                    type="primary" 
                    disabled={remainingToDeposit88 <= 0}
                    icon={<BankOutlined />}
                    onClick={handleDepositFull88}
                    style={{ background: primaryColor, fontWeight: 'bold', height: 40 }}
                  >
                    🏦 ฝากยอดที่เหลือทั้งหมด
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {depositRecord88.history && depositRecord88.history.length > 0 && (
            <Card title={<Text strong style={{ color: '#15803d' }}>ประวัติการทำรายการฝากธนาคาร บัญชี 88 วันที่ {selectedDate.format('DD MMMM YYYY')}</Text>} size="small" style={{ borderRadius: 8, marginBottom: 16 }}>
              <Table 
                dataSource={depositRecord88.history} 
                columns={historyColumns88} 
                rowKey={(_, index) => index} 
                size="small" 
                pagination={false}
                bordered
              />
            </Card>
          )}

          <Card title={<Text strong style={{ color: '#1d4ed8' }}>รายการเคลื่อนไหว บัญชี 88 (สงเคราะห์ศพ) ประจำวันที่ {selectedDate.format('DD MMMM YYYY')}</Text>} size="small" style={{ borderRadius: 8 }}>
            <Table 
              dataSource={receipts88} 
              columns={columns88} 
              rowKey="docNo" 
              size="small" 
              pagination={{ pageSize: 8 }}
              locale={{ emptyText: 'ไม่พบรายการบัญชี 88 ในวันที่เลือก (ข้อมูลดึงจากใบเสร็จอัตโนมัติ)' }}
              bordered
            />
          </Card>
        </div>
      ) : (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #f59e0b', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Statistic 
                  title={<Text strong style={{ color: '#d97706' }}>ยอดคงเหลือรอดำเนินการ</Text>} 
                  value={remainingToHandle87} 
                  precision={2} 
                  suffix="บาท" 
                  valueStyle={{ color: '#d97706', fontWeight: 'bold' }}
                  prefix={<DollarOutlined />}
                />
                <Tag color="orange" style={{ marginTop: 6 }}>จากยอดรวม {grandTotal87.toLocaleString()} ฿</Tag>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #2563eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Statistic 
                  title={<Text strong style={{ color: '#1d4ed8' }}>ฝากธนาคารแล้ว</Text>} 
                  value={alreadyBank87} 
                  precision={2} 
                  suffix="บาท" 
                  valueStyle={{ color: '#1d4ed8', fontWeight: 'bold' }}
                  prefix={<BankOutlined />}
                />
                <Tag color="blue" style={{ marginTop: 6 }}>ส่งยอดไป Dashboard</Tag>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Statistic 
                  title={<Text strong style={{ color: '#047857' }}>เก็บเป็นเงินสดในมือ</Text>} 
                  value={alreadyCash87} 
                  precision={2} 
                  suffix="บาท" 
                  valueStyle={{ color: '#047857', fontWeight: 'bold' }}
                  prefix={<WalletOutlined />}
                />
                <Tag color="green" style={{ marginTop: 6 }}>ส่งยอดไป Dashboard</Tag>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ borderRadius: 8, borderLeft: '4px solid #8b5cf6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Statistic 
                  title={<Text strong style={{ color: '#7c3aed' }}>ยอดรวม บัญชี 87</Text>} 
                  value={grandTotal87} 
                  precision={2} 
                  suffix="บาท" 
                  valueStyle={{ color: '#7c3aed', fontWeight: 'bold' }}
                />
                <Tag color="purple" style={{ marginTop: 6 }}>ยอดรับจากใบเสร็จจริง</Tag>
              </Card>
            </Col>
          </Row>

          <Card size="small" style={{ marginBottom: 16, borderRadius: 8, background: remainingToHandle87 === 0 ? '#f0fdf4' : '#fffbeb', border: `1px solid ${remainingToHandle87 === 0 ? '#bbf7d0' : '#fde68a'}` }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  {remainingToHandle87 === 0 ? <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 20 }} /> : <WalletOutlined style={{ color: '#d97706', fontSize: 20 }} />}
                  <div>
                    <Text strong style={{ fontSize: 14, color: remainingToHandle87 === 0 ? '#15803d' : '#92400e' }}>
                      {remainingToHandle87 === 0 ? 'จัดการยอดบัญชี 87 ครบถ้วนเรียบร้อยแล้ว' : `ยังมียอดค้างดำเนินการอีก ${remainingToHandle87.toLocaleString()} บาท`}
                    </Text>
                    <div style={{ fontSize: 12, color: '#64748b' }}>ฝากธนาคาร: <b>{alreadyBank87.toLocaleString()} ฿</b> | เงินสดในมือ: <b>{alreadyCash87.toLocaleString()} ฿</b></div>
                  </div>
                </Space>
              </Col>
              <Col>
                <Space wrap>
                  <Button 
                    icon={<EditOutlined />}
                    disabled={remainingToHandle87 <= 0}
                    onClick={() => {
                      setModalType87('BANK')
                      customForm87.setFieldsValue({ customAmount: remainingToHandle87 })
                      setIsCustomModalOpen87(true)
                    }}
                    style={{ fontWeight: '600' }}
                  >
                    ✏️ ฝากธนาคาร (ระบุยอด)
                  </Button>
                  <Button 
                    type="primary" 
                    disabled={remainingToHandle87 <= 0}
                    icon={<BankOutlined />}
                    onClick={() => handleActionFull87('BANK')}
                    style={{ background: '#2563eb', fontWeight: 'bold' }}
                  >
                    🏦 ฝากธนาคารทั้งหมด
                  </Button>
                  <Button 
                    icon={<EditOutlined />}
                    disabled={remainingToHandle87 <= 0}
                    onClick={() => {
                      setModalType87('CASH')
                      customForm87.setFieldsValue({ customAmount: remainingToHandle87 })
                      setIsCustomModalOpen87(true)
                    }}
                    style={{ fontWeight: '600' }}
                  >
                    ✏️ เงินสดในมือ (ระบุยอด)
                  </Button>
                  <Button 
                    type="primary" 
                    disabled={remainingToHandle87 <= 0}
                    icon={<WalletOutlined />}
                    onClick={() => handleActionFull87('CASH')}
                    style={{ background: '#059669', fontWeight: 'bold' }}
                  >
                    💰 เก็บเป็นเงินสดในมือทั้งหมด
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {record87.history && record87.history.length > 0 && (
            <Card title={<Text strong style={{ color: '#047857' }}>ประวัติการทำรายการ บัญชี 87 วันที่ {selectedDate.format('DD MMMM YYYY')}</Text>} size="small" style={{ borderRadius: 8, marginBottom: 16 }}>
              <Table 
                dataSource={record87.history} 
                columns={historyColumns87} 
                rowKey={(_, index) => index} 
                size="small" 
                pagination={false}
                bordered
              />
            </Card>
          )}

          <Card title={<Text strong style={{ color: '#1d4ed8' }}>รายการเคลื่อนไหว บัญชี 87 (ค่าบำรุง / บริหาร) ประจำวันที่ {selectedDate.format('DD MMMM YYYY')}</Text>} size="small" style={{ borderRadius: 8 }}>
            <Table 
              dataSource={receipts87} 
              columns={columns87} 
              rowKey="docNo" 
              size="small" 
              pagination={{ pageSize: 8 }}
              locale={{ emptyText: 'ไม่พบรายการบัญชี 87 ในวันที่เลือก (ข้อมูลดึงจากใบเสร็จอัตโนมัติ)' }}
              bordered
            />
          </Card>
        </div>
      )}

      {/* Modal ฝากระบุยอดเอง บัญชี 88 */}
      <Modal
        title="นำฝากธนาคาร บัญชี 88 (ระบุยอดเอง)"
        open={isCustomModalOpen88}
        onCancel={() => setIsCustomModalOpen88(false)}
        onOk={() => customForm88.submit()}
        okText="ยืนยันฝาก"
      >
        <Form form={customForm88} layout="vertical" onFinish={handleCustomSubmit88}>
          <Form.Item 
            name="customAmount" 
            label={`ระบุจำนวนเงินที่ต้องการฝาก (สูงสุด ${remainingToDeposit88.toLocaleString()} บาท)`}
            rules={[{ required: true, message: 'กรุณาระบุจำนวนเงิน' }]}
          >
            <InputNumber style={{ width: '100%' }} size="large" min={1} max={remainingToDeposit88} precision={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal แก้ไขประวัติการฝาก บัญชี 88 */}
      <Modal
        title="แก้ไขยอดเงินรายการฝาก บัญชี 88"
        open={isEditModalOpen88}
        onCancel={() => { setIsEditModalOpen88(false); setEditingIndex88(null); }}
        onOk={() => editForm88.submit()}
        okText="บันทึกการแก้ไข"
      >
        <Form form={editForm88} layout="vertical" onFinish={handleEditHistorySubmit88}>
          <Form.Item 
            name="editAmount" 
            label="จำนวนเงินที่ถูกต้อง"
            rules={[{ required: true, message: 'กรุณาระบุจำนวนเงิน' }]}
          >
            <InputNumber style={{ width: '100%' }} size="large" min={0} precision={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal ฝาก/จัดการระบุยอดเอง บัญชี 87 */}
      <Modal
        title={modalType87 === 'BANK' ? 'ฝากธนาคาร บัญชี 87 (ระบุยอดเอง)' : 'เก็บเงินสดในมือ บัญชี 87 (ระบุยอดเอง)'}
        open={isCustomModalOpen87}
        onCancel={() => setIsCustomModalOpen87(false)}
        onOk={() => customForm87.submit()}
        okText="ยืนยัน"
      >
        <Form form={customForm87} layout="vertical" onFinish={handleCustomSubmit87}>
          <Form.Item 
            name="customAmount" 
            label={`ระบุจำนวนเงิน (สูงสุด ${remainingToHandle87.toLocaleString()} บาท)`}
            rules={[{ required: true, message: 'กรุณาระบุจำนวนเงิน' }]}
          >
            <InputNumber style={{ width: '100%' }} size="large" min={1} max={remainingToHandle87} precision={~~(2)} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal แก้ไขประวัติการจัดการ บัญชี 87 */}
      <Modal
        title="แก้ไขรายการ บัญชี 87"
        open={isEditModalOpen87}
        onCancel={() => { setIsEditModalOpen87(false); setEditingIndex87(null); }}
        onOk={() => editForm87.submit()}
        okText="บันทึกการแก้ไข"
      >
        <Form form={editForm87} layout="vertical" onFinish={handleEditHistorySubmit87}>
          <Form.Item 
            name="editType" 
            label="ประเภทการจัดการ"
            rules={[{ required: true, message: 'กรุณาเลือกประเภท' }]}
          >
            <Select size="large">
              <Option value="BANK">ฝากธนาคาร</Option>
              <Option value="CASH">เก็บเงินสดในมือ</Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="editAmount" 
            label="จำนวนเงินที่ถูกต้อง"
            rules={[{ required: true, message: 'กรุณาระบุจำนวนเงิน' }]}
          >
            <InputNumber style={{ width: '100%' }} size="large" min={0} precision={2} />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  )
}