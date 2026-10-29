import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Card, Button, Typography, Space, message, Alert, Upload, Modal, Row, Col, Statistic } from 'antd'
import { CloudDownloadOutlined, CloudUploadOutlined, DatabaseOutlined, WarningOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography

export default function BackupRestore() {
  const { theme, user } = useOutletContext() || {}
  const primaryColor = theme?.primary || '#1f3a8a'

  // ตรวจสอบสิทธิ์: เฉพาะ Manager หรือ Dev เท่านั้น
  const userRole = user?.role || 'dev'
  const isManagerOrDev = userRole === 'manager' || userRole === 'dev' || user?.name?.includes('Dev') || user?.name?.includes('ผู้จัดการ')

  const [stats, setStats] = useState(() => {
    try {
      const members = JSON.parse(localStorage.getItem('funeral_members')) || []
      const receipts = JSON.parse(localStorage.getItem('funeral_receipts')) || []
      return { memberCount: members.length, receiptCount: receipts.length }
    } catch (e) {
      return { memberCount: 0, receiptCount: 0 }
    }
  })

  // 1. ฟังก์ชันสำรองข้อมูลทุกอย่างที่ขึ้นต้นด้วย funeral_ แบบอัตโนมัติ (บันทึกเป็น .json)
  const handleBackup = () => {
    try {
      const allDataObj = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('funeral_')) {
          try {
            allDataObj[key] = JSON.parse(localStorage.getItem(key))
          } catch {
            allDataObj[key] = localStorage.getItem(key)
          }
        }
      }

      const backupData = {
        version: "2.0",
        appName: "Funeral Association Management System",
        backupDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        data: allDataObj
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2))
      const downloadAnchor = document.createElement('a')
      const fileName = `funeral_complete_backup_${dayjs().format('YYYYMMDD_HHmmss')}.json`
      
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", fileName)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()

      message.success('สำรองข้อมูลทุกโมดูลในระบบสำเร็จเรียบร้อย!')
    } catch (error) {
      console.error(error)
      message.error('❌ เกิดข้อผิดพลาดในการสำรองข้อมูล')
    }
  }

  // 2. ฟังก์ชันกู้คืนและซิงค์ข้อมูลทุกโมดูลกลับมาตามไฟล์ (รองรับไฟล์ .json)
  const handleRestoreFile = (file) => {
    if (!isManagerOrDev) {
      message.error('ขออภัย! เฉพาะผู้จัดการ (Manager) หรือ Dev เท่านั้นที่มีสิทธิ์กู้คืนข้อมูลระบบ')
      return false
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        if (!parsed.data) {
          throw new Error('รูปแบบไฟล์ไม่ถูกต้อง')
        }

        Modal.confirm({
          title: '⚠️ ยืนยันการกู้คืนและซิงค์ข้อมูลระบบทั้งหมด',
          content: `คุณต้องการกู้คืนข้อมูลจากไฟล์สำรองวันที่ [${parsed.backupDate || 'ไม่ระบุ'}] ใช่หรือไม่? ยอดเงิน สถานะสมาชิก ใบเสร็จ และทุกบัญชีจะถูกแทนที่และซิงค์กลับมาตรงตามไฟล์นี้ทั้งหมด`,
          okText: 'ยืนยันกู้คืน',
          okButtonProps: { danger: true },
          cancelText: 'ยกเลิก',
          onOk: () => {
            // ล้างข้อมูลเก่าที่เป็น funeral_ ออกก่อนทั้งหมดเพื่อให้สะอาดและตรงไฟล์เป๊ะ
            const keysToRemove = []
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key && key.startsWith('funeral_')) {
                keysToRemove.push(key)
              }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k))

            // บันทึกข้อมูลใหม่จากไฟล์สำรองลง LocalStorage
            const db = parsed.data
            Object.keys(db).forEach(key => {
              const val = db[key]
              if (typeof val === 'object' && val !== null) {
                localStorage.setItem(key, JSON.stringify(val))
              } else {
                localStorage.setItem(key, String(val))
              }
            })

            message.success('กู้คืนและซิงค์ข้อมูลทุกโมดูลสำเร็จ! กำลังรีเฟรชหน้าจอ...')
            setTimeout(() => window.location.reload(), 1200)
          }
        })
      } catch (err) {
        message.error('❌ ไฟล์สำรองข้อมูลไม่ถูกต้องหรือเสียหาย')
      }
    }
    reader.readAsText(file)
    return false
  }

  return (
    <div style={{ maxWidth: 850, margin: '0 auto', paddingBottom: 40, padding: '16px' }}>
      <Card 
        title={<Space><DatabaseOutlined style={{ color: primaryColor }} /><span>ระบบสำรองและกู้คืนข้อมูล (Backup & Restore)</span></Space>}
        style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${primaryColor}` }}
      >
        <Alert
          message="คำแนะนำการใช้งาน"
          description="ระบบนี้จะทำการเก็บและกู้คืนข้อมูลทุกโมดูล (สมาชิก, ใบเสร็จ, ยอดฝากบัญชี 87/88, ยอดเงินสด, ตั้งค่าสมาคม และการปิดสิ้นงวด) ให้ซิงค์ตรงกันทั้งหมดโดยอัตโนมัติ"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} md={12}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <Statistic title="จำนวนสมาชิกในระบบ" value={stats.memberCount} suffix="คน" />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <Statistic title="จำนวนใบเสร็จทั้งหมด" value={stats.receiptCount} suffix="ฉบับ" valueStyle={{ color: '#059669' }} />
            </div>
          </Col>
        </Row>

        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 24, textAlign: 'center' }}>
          <Title level={5} style={{ color: primaryColor, marginBottom: 12 }}>1. สำรองข้อมูลทั้งหมด (Export Backup)</Title>
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            คลิกปุ่มด้านล่างเพื่อดาวน์โหลดฐานข้อมูลทุกส่วนในระบบเก็บไว้เป็นไฟล์ `.json`
          </Paragraph>
          <Button 
            type="primary" 
            size="large" 
            icon={<CloudDownloadOutlined />} 
            onClick={handleBackup}
            style={{ background: primaryColor, height: 45, paddingInline: 32, fontSize: 16 }}
          >
            ดาวน์โหลดไฟล์สำรองข้อมูลทั้งหมด (.json)
          </Button>
        </div>

        <div style={{ background: '#fffbeb', padding: '20px', borderRadius: 8, border: '1px solid #fde68a', textAlign: 'center' }}>
          <Title level={5} style={{ color: '#d97706', marginBottom: 12 }}><WarningOutlined /> 2. กู้คืนและซิงค์ข้อมูล (Restore Backup)</Title>
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            เลือกไฟล์สำรองนามสกุล `.json` เพื่อกู้คืนข้อมูล (จำกัดสิทธิ์เฉพาะผู้จัดการหรือ Dev)
          </Paragraph>
          
          <Upload 
            beforeUpload={handleRestoreFile} 
            showUploadList={false}
            accept=".json"
          >
            <Button 
              size="large" 
              icon={<CloudUploadOutlined />} 
              danger
              style={{ height: 45, paddingInline: 32, fontSize: 16, fontWeight: 'bold' }}
            >
              เลือกไฟล์ .json เพื่อกู้คืนข้อมูล
            </Button>
          </Upload>
        </div>
      </Card>
    </div>
  )
}