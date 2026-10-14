USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'AppointmentSystemDB')
BEGIN
    ALTER DATABASE AppointmentSystemDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE AppointmentSystemDB;
END
GO

CREATE DATABASE AppointmentSystemDB COLLATE Vietnamese_CI_AS;
GO

USE AppointmentSystemDB;
GO

-- 1. Table Customers (Khách hàng)
CREATE TABLE Customers (
    Id           INT           IDENTITY(1,1) PRIMARY KEY,
    FullName     NVARCHAR(100) NOT NULL,
    Email        NVARCHAR(100) COLLATE Latin1_General_CI_AS NOT NULL UNIQUE,
    Phone        NVARCHAR(20)  NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    IsActive     BIT           NOT NULL DEFAULT 1,
    CreatedAt    DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- 2. Table Staffs (Nhân viên / Bác sĩ / Quản trị)
CREATE TABLE Staffs (
    Id           INT           IDENTITY(1,1) PRIMARY KEY,
    FullName     NVARCHAR(100) NOT NULL,
    Email        NVARCHAR(100) COLLATE Latin1_General_CI_AS NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role         NVARCHAR(20)  NOT NULL DEFAULT 'Staff' CHECK (Role IN ('Admin','Staff')),
    IsActive     BIT           NOT NULL DEFAULT 1,
    CreatedAt    DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- 3. Table Services (Dịch vụ)
CREATE TABLE Services (
    Id              INT            IDENTITY(1,1) PRIMARY KEY,
    Name            NVARCHAR(100)  NOT NULL,
    Description     NVARCHAR(500)  NULL,
    DurationMinutes INT            NOT NULL DEFAULT 30 CHECK (DurationMinutes > 0),
    Price           DECIMAL(18,2)  NOT NULL DEFAULT 0  CHECK (Price >= 0),
    IsActive        BIT            NOT NULL DEFAULT 1
);
GO

-- 4. Table Appointments (Lịch hẹn)
CREATE TABLE Appointments (
    Id              INT           IDENTITY(1,1) PRIMARY KEY,
    CustomerId      INT           NOT NULL,
    StaffId         INT           NULL,
    ServiceId       INT           NOT NULL,
    AppointmentDate DATE          NOT NULL,
    StartTime       TIME          NOT NULL,
    EndTime         TIME          NOT NULL,
    Status          NVARCHAR(20)  NOT NULL DEFAULT 'Pending'
                                  CHECK (Status IN ('Pending','Confirmed','Completed','Cancelled')),
    Notes           NVARCHAR(500) NULL,
    CreatedAt       DATETIME      NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME      NULL,
    CONSTRAINT FK_Appt_Customer FOREIGN KEY (CustomerId) REFERENCES Customers(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Appt_Staff    FOREIGN KEY (StaffId)    REFERENCES Staffs(Id)    ON DELETE SET NULL,
    CONSTRAINT FK_Appt_Service  FOREIGN KEY (ServiceId)  REFERENCES Services(Id)  ON DELETE NO ACTION,
    CONSTRAINT CHK_Time         CHECK (EndTime > StartTime)
);
GO

-- Indexes for frequently queried columns: AppointmentTime (Date + StartTime), Status, CustomerId, StaffId
CREATE INDEX IX_Appointments_Date_Time ON Appointments(AppointmentDate, StartTime);
CREATE INDEX IX_Appointments_Date_Status ON Appointments(AppointmentDate, Status);
CREATE INDEX IX_Appointments_Status ON Appointments(Status);
CREATE INDEX IX_Appointments_CustomerId ON Appointments(CustomerId);
CREATE INDEX IX_Appointments_StaffId ON Appointments(StaffId);
GO

-- 5. Table Notifications (Thông báo)
CREATE TABLE Notifications (
    Id            INT           IDENTITY(1,1) PRIMARY KEY,
    AppointmentId INT           NOT NULL,
    Message       NVARCHAR(500) NOT NULL,
    Type          NVARCHAR(30)  NOT NULL DEFAULT 'Reminder'
                                CHECK (Type IN ('Reminder','StatusChanged','General')),
    IsRead        BIT           NOT NULL DEFAULT 0,
    SentAt        DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Notif_Appt FOREIGN KEY (AppointmentId) REFERENCES Appointments(Id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_Notifications_AppointmentId ON Notifications(AppointmentId);
CREATE INDEX IX_Notifications_IsRead ON Notifications(IsRead);
GO

-- 6. SEED DATA (Chuẩn hóa tiền tố N'' cho toàn bộ chuỗi tiếng Việt Unicode)
INSERT INTO Staffs (FullName, Email, PasswordHash, Role) VALUES
  (N'Quản trị viên',    'admin@appointment.com', '123456', 'Admin'),
  (N'Trần Nhân Viên',   'staff@appointment.com', '123456', 'Staff'),
  (N'Bác sĩ Hoàng Nam', 'doctor@appointment.com', '123456', 'Staff');
GO

INSERT INTO Services (Name, Description, DurationMinutes, Price) VALUES
  (N'Tư vấn cơ bản',   N'Buổi tư vấn khám và đánh giá ban đầu 30 phút', 30, 200000),
  (N'Khám chuyên sâu', N'Khám tổng quát chuyên sâu và tư vấn chi tiết 60 phút', 60, 500000),
  (N'Theo dõi định kỳ',N'15 phút kiểm tra sức khỏe và chỉ số định kỳ', 15, 100000),
  (N'Khám tổng quát',  N'Gói khám sức khỏe toàn diện các chuyên khoa', 90, 750000);
GO

INSERT INTO Customers (FullName, Email, Phone, PasswordHash) VALUES
  (N'Nguyễn Văn Khách', 'khachhang@gmail.com', '0901234567', '123456'),
  (N'Phạm Thị Test',    'phamtest@gmail.com',  '0912345678', '123456'),
  (N'Lê Thu Trang',     'lethutrang@gmail.com', '0988776655', '123456');
GO

INSERT INTO Appointments (CustomerId, StaffId, ServiceId, AppointmentDate, StartTime, EndTime, Status, Notes) VALUES
  (1, 2, 1, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)), '09:00', '09:30', 'Pending',   N'Lần đầu tiên đặt lịch khám'),
  (1, 2, 2, DATEADD(DAY, 2, CAST(GETDATE() AS DATE)), '14:00', '15:00', 'Confirmed', N'Tái khám theo chỉ định'),
  (2, 3, 4, DATEADD(DAY, 3, CAST(GETDATE() AS DATE)), '08:30', '10:00', 'Confirmed', N'Khám tổng quát định kỳ hàng năm'),
  (3, 2, 3, DATEADD(DAY, 1, CAST(GETDATE() AS DATE)), '10:30', '10:45', 'Pending',   N'Kiểm tra huyết áp và xét nghiệm');
GO

INSERT INTO Notifications (AppointmentId, Message, Type, IsRead) VALUES
  (1, N'Lịch hẹn #1 đã được tạo và đang chờ duyệt.', 'General', 0),
  (2, N'Nhắc nhở: Lịch hẹn Khám chuyên sâu vào ngày mai lúc 14:00.', 'Reminder', 0);
GO

SELECT 'Customers'     AS [Table], COUNT(*) AS Rows FROM Customers     UNION ALL
SELECT 'Staffs',                   COUNT(*)          FROM Staffs        UNION ALL
SELECT 'Services',                 COUNT(*)          FROM Services      UNION ALL
SELECT 'Appointments',             COUNT(*)          FROM Appointments  UNION ALL
SELECT 'Notifications',            COUNT(*)          FROM Notifications;
GO
PRINT 'AppointmentSystemDB successfully initialized!';
GO
