import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import thTH from 'antd/locale/th_TH'
import Login from './pages/Login.jsx'
import AdminLayout from './pages/AdminLayout.jsx'
import Shell from './pages/Shell.jsx' 
import Dashboard from './pages/Dashboard.jsx' //  หน้าแดชบอร์ด
import Members from './pages/Members.jsx'   // หน้าจัดการสมาชิก
import Receipts from './pages/Receipts.jsx' // หน้าใบเสร็จรับเงินปกติ
import BackdateReceipts from './pages/BackdateReceipts.jsx' // หน้าใบเสร็จย้อนหลัง
import GroupReceipts from './pages/GroupReceipts.jsx' // หน้าใบเสร็จรับเงินเป็นกลุ่มหมู่บ้าน
import AdvancePaymentEdit from './pages/AdvancePaymentEdit.jsx' // หน้าบันทึกแก้ไขรายการชำระล่วงหน้าข้ามปี
import SystemUsers from './pages/SystemUsers.jsx' // หน้าจัดการผู้ใช้งานระบบ
import ResetSystem from './pages/ResetSystem.jsx' // หน้าล้างข้อมูลระบบทั้งหมด (Factory Reset)
import ReceiptSummaryReport from './pages/ReceiptSummaryReport.jsx' // รายงานสรุปใบเสร็จรายวัน
import ReceiptSummaryByCollectorReport from './pages/ReceiptSummaryByCollectorReport.jsx' // รายงานสรุปใบเสร็จรายวันตามผู้รับเงิน
import ClosingProcess from './pages/ClosingProcess.jsx' // หน้าประมวลผลยอดคงเหลือใหม่
import ClosingYear from './pages/ClosingYear.jsx' // หน้าปิดสิ้นปี
import GeneralLedger from './pages/GeneralLedger.jsx' // หน้าบัญชีแยกประเภท (ฝากเงิน)
import Disbursement from './pages/Disbursement.jsx' // หน้าถอนเงิน / เบิกจ่าย
import BalanceInquiry from './pages/BalanceInquiry.jsx' // หน้าสอบถามยอดคงเหลือสมาชิก
import WarningLetter from './pages/WarningLetter.jsx' // หน้าออกหนังสือแจ้งเตือน
import WarningLetterAdvance from './pages/WarningLetterAdvance.jsx' // หน้าออกหนังสือแจ้งเตือนประจำปีล่วงหน้า
import MemberStatusIndividual from './pages/MemberStatusIndividual.jsx' // หน้าบันทึกปรับสถานภาพสมาชิกรายบุคคล
import MemberStatusDateRange from './pages/MemberStatusDateRange.jsx' // หน้าปรับสิทธิสมาชิกตามช่วงวันที่
import MemberResigned from './pages/MemberResigned.jsx' // หน้าบันทึกสมาชิกลาออก ให้ออก ขาดสิทธิ
import MemberDeceased from './pages/MemberDeceased.jsx' // หน้าบันทึกสมาชิกเสียชีวิต
import EditCorpseOrder from './pages/EditCorpseOrder.jsx' // หน้าแก้ไขลำดับศพใหม่
import WelfareDeduction from './pages/WelfareDeduction.jsx' // การดำเนินงานหักเงินสงเคราะห์
import WarningLetterA4 from './pages/WarningLetterA4.jsx' // หน้าออกหนังสือเตือน A4
import OrganizationInfo from './pages/OrganizationInfo.jsx' // หน้าข้อมูลหน่วยงาน
import BackupRestore from './pages/BackupRestore.jsx';  // สำรองข้อมูลและกู้คืนข้อมูล
import MemberSummaryReport from './pages/MemberSummaryReport.jsx' // รายงานสรุปสมาชิก
import MemberListReport from './pages/MemberListReport.jsx' // รายงานสมาชิกแยกประเภท
import MemberLedgerReport from './pages/MemberLedgerReport.jsx' // รายงานบัญชีแยกประเภทสมาชิก
import AdvancePaymentReport from './pages/AdvancePaymentReport.jsx' // รายงานสรุปการชำระล่วงหน้า (แก้ชื่อไฟล์ให้ถูกต้องแล้ว)
import MemberRegisterReportSK1 from './pages/MemberRegisterReportSK1.jsx' // รายงานทะเบียนสมาชิกแบบ SK1
import MemberReportSK4 from './pages/MemberReportSK4.jsx' // รายงานทะเบียนสมาชิกแบบ SK4
import MemberDeathReportSK11 from './pages/MemberDeathReportSK11.jsx' // รายงานทะเบียนสมาชิกเสียชีวิตแบบ SK11
import MemberDeceasedReportSK11 from './pages/MemberDeceasedReportSK11.jsx' // รายงานทะเบียนสมาชิกเสียชีวิตแบบ SK11R1
import MemberAdvanceYearEndReportSK12 from './pages/MemberAdvanceYearEndReportSK12.jsx' // รายงานทะเบียนสมาชิกชำระล่วงหน้าสิ้นปีแบบ SK12
import MemberInactiveReport from './pages/MemberInactiveReport.jsx' // รายงานทะเบียนสมาชิกพ้นสภาพ
import MemberInactiveReportSK1 from './pages/MemberInactiveReportSK1.jsx' // รายงานทะเบียนสมาชิกพ้นสภาพแบบ SK1
import MemberByVillageReport from './pages/MemberByVillageReport.jsx' // รายงานสมาชิกตามหมู่บ้าน
import MemberAdvancePaymentNoticeReport from './pages/MemberAdvancePaymentNoticeReport.jsx' // รายงานสมาชิกแจ้งชำระเงินล่วงหน้า
import DeceasedMemberReport from './pages/DeceasedMemberReport.jsx' // รายงานสมาชิกเสียชีวิต
import MemberBalanceCheckReport from './pages/MemberBalanceCheckReport.jsx' // รายงานตรวจสอบยอดคงเหลือสมาชิก
import MoneyTypeManagement from './pages/MoneyTypeManagement.jsx' // หน้าจัดการประเภทเงิน
import VillageInformation from './pages/VillageInformation.jsx' // หน้าจัดการข้อมูลหมู่บ้าน
import EditArrearsModal from './pages/EditArrearsModal.jsx' // หน้าจัดการแก้ไขยอดค้างชำระสมาชิก
import EditMemberStatusModal from './pages/EditMemberStatusModal.jsx' // หน้าจัดการแก้ไขสถานภาพสมาชิก
import EditDeductionModal from './pages/EditDeductionModal.jsx' // หน้าจัดการแก้ไขรายการหักเงินสงเคราะห์
import ClearMaintenanceDeductionModal from './pages/ClearMaintenanceDeductionModal.jsx' // หน้าจัดการล้างรายการหักเงินสงเคราะห์ค่าบำรุง
import SetupMemberSequenceModal from './pages/SetupMemberSequenceModal.jsx' // หน้าจัดการลำดับสมาชิกใหม่
import SetupReceiptSequenceModal from './pages/SetupReceiptSequenceModal.jsx' // หน้าจัดการลำดับใบเสร็จ
import SetupRetroactiveReceiptSequenceModal from './pages/SetupRetroactiveReceiptSequenceModal.jsx' // หน้าจัดการลำดับใบเสร็จย้อนหลัง
import SetupGroupReceiptSequenceModal from './pages/SetupGroupReceiptSequenceModal.jsx' // หน้าจัดการลำดับใบเสร็จหมู่บ้าน
import SetupPrinterModal from './pages/SetupPrinterModal.jsx' // หน้าจัดการตั้งค่าเครื่องพิมพ์
import SetupPassbookPrinterModal from './pages/SetupPassbookPrinterModal.jsx' // หน้าจัดการตั้งค่าเครื่องพิมพ์สมุดเงินฝาก
import SetupWarningLetterPrinterModal from './pages/SetupWarningLetterPrinterModal.jsx' // หน้าจัดการตั้งค่าเครื่องพิมพ์หนังสือแจ้งเตือน

export default function App() {
  const [user, setUser] = useState(null)

  // ตรวจสอบว่าเป็น Master Dev หลักที่ติดมากับโปรแกรมหรือไม่ (เช่น รหัส DEV)
  const isMasterDev = user?.role === 'dev' && (user?.code?.toUpperCase() === 'DEV' || user?.isMasterDev)

  // เลือก Layout ตามระดับสิทธิ์ (Master Dev ใช้ AdminLayout เมนูด้านข้าง, ผู้ใช้อื่นใช้ Shell เมนูด้านบน)
  const SelectedLayout = isMasterDev ? AdminLayout : Shell

  return (
    <ConfigProvider
      locale={thTH}
      theme={{ token: { fontFamily: "'Sarabun', sans-serif", colorPrimary: '#1f3a8a' } }}
    >
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />}
        />
        <Route
          path="/"
          element={user ? <SelectedLayout user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="receipts/normal" element={<Receipts />} />
          <Route path="receipts/backdate" element={<BackdateReceipts />} />
          <Route path="receipts/history" element={<BackdateReceipts />} /> 
          <Route path="receipts/group" element={<GroupReceipts />} />
          <Route path="receipts/advance-edit" element={<AdvancePaymentEdit />} />
          <Route path="receipts/summary-report" element={<ReceiptSummaryReport />} />
          <Route path="receipts/collector-summary" element={<ReceiptSummaryByCollectorReport />} />
         
          {/* สมาชิก */}
          <Route path="members/rights-status" element={<MemberStatusIndividual />} />
          <Route path="members/date-rights" element={<MemberStatusDateRange />} />
          <Route path="members/resign-status" element={<MemberResigned />} />
          <Route path="members/dead-welfare" element={<MemberDeceased />} />
          <Route path="members/edit-corpse-order" element={<EditCorpseOrder />} />
          <Route path="members/travel-expense" element={<WelfareDeduction />} />

          {/* รายงาน */}
          <Route path="reports/notice" element={<WarningLetter />} />
          <Route path="reports/notice-advance" element={<WarningLetterAdvance />} />
          <Route path="reports/notice-a4" element={<WarningLetterA4 />} />
          <Route path="reports/summary-members" element={<MemberSummaryReport />} />
          <Route path="reports/members-by-type" element={<MemberListReport />} />
          <Route path="reports/resign-list" element={<MemberLedgerReport />} />
          <Route path="reports/payment-summary" element={<AdvancePaymentReport />} />
          <Route path="reports/form-4-r1" element={<MemberRegisterReportSK1 />} />
          <Route path="reports/form-4" element={<MemberReportSK4 />} />
          <Route path="reports/form-11-alive" element={<MemberDeathReportSK11 />} />
          <Route path="reports/form-11-alive-r1" element={<MemberDeceasedReportSK11 />} />
          <Route path="reports/form-12" element={<MemberAdvanceYearEndReportSK12 />} />
          <Route path="reports/status-registry" element={<MemberInactiveReport />} />
          <Route path="reports/status-registry-r1" element={<MemberInactiveReportSK1 />} />
          <Route path="reports/village-payment" element={<MemberByVillageReport />} />
          <Route path="reports/advance-payment" element={<MemberAdvancePaymentNoticeReport />} />
          <Route path="reports/life-insurance-list" element={<DeceasedMemberReport />} />
          <Route path="reports/balance-check-list" element={<MemberBalanceCheckReport />} />

          {/* จัดการระบบ */}
          <Route path="admin/org" element={<OrganizationInfo />} />
          <Route path="admin/money-type" element={<MoneyTypeManagement />} />
          <Route path="admin/villages" element={<VillageInformation />} />
          <Route path="admin/edit-price" element={<EditArrearsModal />} />
          <Route path="admin/edit-rights" element={<EditMemberStatusModal />} />
          <Route path="admin/edit-welfare-date" element={<EditDeductionModal />} />
          <Route path="admin/edit-deposit-date" element={<ClearMaintenanceDeductionModal />} />
          <Route path="admin/cfg-member-reg" element={<SetupMemberSequenceModal />} />
          <Route path="admin/cfg-receipt" element={<SetupReceiptSequenceModal />} />
          <Route path="admin/cfg-receipt-backdate" element={<SetupRetroactiveReceiptSequenceModal />} />
          <Route path="admin/cfg-village-meeting" element={<SetupGroupReceiptSequenceModal />} />
          <Route path="admin/cfg-welfare-sue" element={<SetupPrinterModal />} />
          <Route path="admin/cfg-deposit-sue" element={<SetupPassbookPrinterModal />} />
          <Route path="admin/cfg-salary-sue" element={<SetupWarningLetterPrinterModal />} />
          <Route path="admin/users" element={<SystemUsers />} />
          <Route path="admin/reset" element={<ResetSystem />} />

          {/* สำรองข้อมูล */}
          <Route path="backup/data" element={<BackupRestore />} />
          
          {/* ถามยอดคงเหลือ */}
          <Route path="query/balance" element={<BalanceInquiry />} />
          
          {/* ปิดสิ้นงวด */}
          <Route path="closing/process" element={<ClosingProcess />} />
          <Route path="closing/year" element={<ClosingYear />} />
          
          {/* บัญชีแยกประเภท: ฝากเงิน (บัญชี 87 และ 88) */}
          <Route path="accounting/ledger/87" element={<GeneralLedger />} />
          <Route path="accounting/ledger/88" element={<GeneralLedger />} />

          {/* บัญชีแยกประเภท: ถอนเงิน / เบิกจ่าย (บัญชี 87 และ 88) */}
          <Route path="accounting/disbursement/87" element={<Disbursement />} />
          <Route path="accounting/disbursement/88" element={<Disbursement />} />
        </Route>
      </Routes>
    </ConfigProvider>
  )
}