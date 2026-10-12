# Lược đồ CSDL của TM-xA (chỉ tên bảng và cột — KHÔNG có dữ liệu)

Rút từ ECS.mdb và Report.mdb (Access/Jet 4.0, có mật khẩu viết cứng trong mã: xem `nghien-cuu/ma-dich-nguoc/ECS/Program.cs`, chuỗi `Jet OLEDB:Database Password`). Các file .mdb KHÔNG được đưa lên vì chứa bảng Password, tên WiFi mặc định và dữ liệu bán hàng của cửa hàng khác. Mỗi dòng: `Cột:Kiểu`.

## ECS.mdb

### Barcode

`BarID:Int32` · `Name:String` · `Format:Int32` · `Check:Int32` · `Num1:Int32` · `Num2:Int32` · `TChar:String`

### Class

`ClassID:Int32` · `Name:String` · `DeptID:Int32` · `BarF1:Int32` · `BarF2:Int32` · `BarT1:Int32` · `BarT2:Int32` · `LabelID1:Int32` · `LabelID2:Int32`

### CoPLU_BoxPcs

`PLUID_Box:Int32` · `PLUID_Pcs:Int32` · `Multi:Int32`

### CoPLU_ProMat

`PLUID_Product:Int32` · `PLUID_Material:Int32` · `Multi:Decimal`

### Custom1

`ID:Int32` · `Text1:String` · `Text2:String` · `Text3:String` · `Text4:String` · `Text5:String` · `Text6:String` · `Text7:String` · `Text8:String` · `Text9:String` · `Text10:String` · `Text11:String` · `Text12:String` · `Text13:String` · `Text14:String` · `Text15:String` · `Text16:String` · `Text17:String` · `Text18:String` · `Text19:String` · `Text20:String` · `Text21:String` · `Text22:String` · `Text23:String` · `Text24:String` · `Text25:String` · `Text26:String` · `Text27:String` · `Text28:String` · `Text29:String` · `Text30:String` · `Text31:String` · `Text32:String` · `Text33:String` · `Text34:String` · `Text35:String` · `Text36:String` · `Text37:String` · `Text38:String` · `Text39:String` · `Text40:String` · `Int1:Int32` · `Int2:Int32` · `Int3:Int32` · `Int4:Int32` · `Int5:Int32` · `Int6:Int32` · `Int7:Int32` · `Int8:Int32` · `Int9:Int32` · `Int10:Int32` · `Int11:Int32` · `Int12:Int32` · `Int13:Int32` · `Int14:Int32` · `Int15:Int32` · `Int16:Int32` · `Int17:Int32` · `Int18:Int32` · `Int19:Int32` · `Int20:Int32` · `Int21:Int32` · `Int22:Int32` · `Int23:Int32` · `Int24:Int32` · `Int25:Int32` · `Int26:Int32` · `Int27:Int32` · `Int28:Int32` · `Int29:Int32` · `Int30:Int32` · `Int31:Int32` · `Int32:Int32` · `Int33:Int32` · `Int34:Int32` · `Int35:Int32` · `Int36:Int32` · `Int37:Int32` · `Int38:Int32` · `Int39:Int32` · `Int40:Int32` · `Dec1:Decimal` · `Dec2:Decimal` · `Dec3:Decimal` · `Dec4:Decimal` · `Dec5:Decimal` · `Dec6:Decimal` · `Dec7:Decimal` · `Dec8:Decimal` · `Dec9:Decimal` · `Dec10:Decimal` · `Dec11:Decimal` · `Dec12:Decimal` · `Dec13:Decimal` · `Dec14:Decimal` · `Dec15:Decimal` · `Dec16:Decimal` · `Dec17:Decimal` · `Dec18:Decimal` · `Dec19:Decimal` · `Dec20:Decimal` · `Dec21:Decimal` · `Dec22:Decimal` · `Dec23:Decimal` · `Dec24:Decimal` · `Dec25:Decimal` · `Dec26:Decimal` · `Dec27:Decimal` · `Dec28:Decimal` · `Dec29:Decimal` · `Dec30:Decimal` · `Dec31:Decimal` · `Dec32:Decimal` · `Dec33:Decimal` · `Dec34:Decimal` · `Dec35:Decimal` · `Dec36:Decimal` · `Dec37:Decimal` · `Dec38:Decimal` · `Dec39:Decimal` · `Dec40:Decimal`

### Custom2

`ID:Int32` · `Text1:String` · `Text2:String` · `Text3:String` · `Text4:String` · `Text5:String` · `Text6:String` · `Text7:String` · `Text8:String` · `Text9:String` · `Text10:String` · `Text11:String` · `Text12:String` · `Text13:String` · `Text14:String` · `Text15:String` · `Text16:String` · `Text17:String` · `Text18:String` · `Text19:String` · `Text20:String` · `Text21:String` · `Text22:String` · `Text23:String` · `Text24:String` · `Text25:String` · `Text26:String` · `Text27:String` · `Text28:String` · `Text29:String` · `Text30:String` · `Text31:String` · `Text32:String` · `Text33:String` · `Text34:String` · `Text35:String` · `Text36:String` · `Text37:String` · `Text38:String` · `Text39:String` · `Text40:String` · `Int1:Int32` · `Int2:Int32` · `Int3:Int32` · `Int4:Int32` · `Int5:Int32` · `Int6:Int32` · `Int7:Int32` · `Int8:Int32` · `Int9:Int32` · `Int10:Int32` · `Int11:Int32` · `Int12:Int32` · `Int13:Int32` · `Int14:Int32` · `Int15:Int32` · `Int16:Int32` · `Int17:Int32` · `Int18:Int32` · `Int19:Int32` · `Int20:Int32` · `Int21:Int32` · `Int22:Int32` · `Int23:Int32` · `Int24:Int32` · `Int25:Int32` · `Int26:Int32` · `Int27:Int32` · `Int28:Int32` · `Int29:Int32` · `Int30:Int32` · `Int31:Int32` · `Int32:Int32` · `Int33:Int32` · `Int34:Int32` · `Int35:Int32` · `Int36:Int32` · `Int37:Int32` · `Int38:Int32` · `Int39:Int32` · `Int40:Int32` · `Dec1:Decimal` · `Dec2:Decimal` · `Dec3:Decimal` · `Dec4:Decimal` · `Dec5:Decimal` · `Dec6:Decimal` · `Dec7:Decimal` · `Dec8:Decimal` · `Dec9:Decimal` · `Dec10:Decimal` · `Dec11:Decimal` · `Dec12:Decimal` · `Dec13:Decimal` · `Dec14:Decimal` · `Dec15:Decimal` · `Dec16:Decimal` · `Dec17:Decimal` · `Dec18:Decimal` · `Dec19:Decimal` · `Dec20:Decimal` · `Dec21:Decimal` · `Dec22:Decimal` · `Dec23:Decimal` · `Dec24:Decimal` · `Dec25:Decimal` · `Dec26:Decimal` · `Dec27:Decimal` · `Dec28:Decimal` · `Dec29:Decimal` · `Dec30:Decimal` · `Dec31:Decimal` · `Dec32:Decimal` · `Dec33:Decimal` · `Dec34:Decimal` · `Dec35:Decimal` · `Dec36:Decimal` · `Dec37:Decimal` · `Dec38:Decimal` · `Dec39:Decimal` · `Dec40:Decimal`

### Custom3

`ID:Int32` · `Text1:String` · `Text2:String` · `Text3:String` · `Text4:String` · `Text5:String` · `Text6:String` · `Text7:String` · `Text8:String` · `Text9:String` · `Text10:String` · `Text11:String` · `Text12:String` · `Text13:String` · `Text14:String` · `Text15:String` · `Text16:String` · `Text17:String` · `Text18:String` · `Text19:String` · `Text20:String` · `Text21:String` · `Text22:String` · `Text23:String` · `Text24:String` · `Text25:String` · `Text26:String` · `Text27:String` · `Text28:String` · `Text29:String` · `Text30:String` · `Text31:String` · `Text32:String` · `Text33:String` · `Text34:String` · `Text35:String` · `Text36:String` · `Text37:String` · `Text38:String` · `Text39:String` · `Text40:String` · `Int1:Int32` · `Int2:Int32` · `Int3:Int32` · `Int4:Int32` · `Int5:Int32` · `Int6:Int32` · `Int7:Int32` · `Int8:Int32` · `Int9:Int32` · `Int10:Int32` · `Int11:Int32` · `Int12:Int32` · `Int13:Int32` · `Int14:Int32` · `Int15:Int32` · `Int16:Int32` · `Int17:Int32` · `Int18:Int32` · `Int19:Int32` · `Int20:Int32` · `Int21:Int32` · `Int22:Int32` · `Int23:Int32` · `Int24:Int32` · `Int25:Int32` · `Int26:Int32` · `Int27:Int32` · `Int28:Int32` · `Int29:Int32` · `Int30:Int32` · `Int31:Int32` · `Int32:Int32` · `Int33:Int32` · `Int34:Int32` · `Int35:Int32` · `Int36:Int32` · `Int37:Int32` · `Int38:Int32` · `Int39:Int32` · `Int40:Int32` · `Dec1:Decimal` · `Dec2:Decimal` · `Dec3:Decimal` · `Dec4:Decimal` · `Dec5:Decimal` · `Dec6:Decimal` · `Dec7:Decimal` · `Dec8:Decimal` · `Dec9:Decimal` · `Dec10:Decimal` · `Dec11:Decimal` · `Dec12:Decimal` · `Dec13:Decimal` · `Dec14:Decimal` · `Dec15:Decimal` · `Dec16:Decimal` · `Dec17:Decimal` · `Dec18:Decimal` · `Dec19:Decimal` · `Dec20:Decimal` · `Dec21:Decimal` · `Dec22:Decimal` · `Dec23:Decimal` · `Dec24:Decimal` · `Dec25:Decimal` · `Dec26:Decimal` · `Dec27:Decimal` · `Dec28:Decimal` · `Dec29:Decimal` · `Dec30:Decimal` · `Dec31:Decimal` · `Dec32:Decimal` · `Dec33:Decimal` · `Dec34:Decimal` · `Dec35:Decimal` · `Dec36:Decimal` · `Dec37:Decimal` · `Dec38:Decimal` · `Dec39:Decimal` · `Dec40:Decimal`

### Custom4

`ID:Int32` · `Text1:String` · `Text2:String` · `Text3:String` · `Text4:String` · `Text5:String` · `Text6:String` · `Text7:String` · `Text8:String` · `Text9:String` · `Text10:String` · `Text11:String` · `Text12:String` · `Text13:String` · `Text14:String` · `Text15:String` · `Text16:String` · `Text17:String` · `Text18:String` · `Text19:String` · `Text20:String` · `Text21:String` · `Text22:String` · `Text23:String` · `Text24:String` · `Text25:String` · `Text26:String` · `Text27:String` · `Text28:String` · `Text29:String` · `Text30:String` · `Text31:String` · `Text32:String` · `Text33:String` · `Text34:String` · `Text35:String` · `Text36:String` · `Text37:String` · `Text38:String` · `Text39:String` · `Text40:String` · `Int1:Int32` · `Int2:Int32` · `Int3:Int32` · `Int4:Int32` · `Int5:Int32` · `Int6:Int32` · `Int7:Int32` · `Int8:Int32` · `Int9:Int32` · `Int10:Int32` · `Int11:Int32` · `Int12:Int32` · `Int13:Int32` · `Int14:Int32` · `Int15:Int32` · `Int16:Int32` · `Int17:Int32` · `Int18:Int32` · `Int19:Int32` · `Int20:Int32` · `Int21:Int32` · `Int22:Int32` · `Int23:Int32` · `Int24:Int32` · `Int25:Int32` · `Int26:Int32` · `Int27:Int32` · `Int28:Int32` · `Int29:Int32` · `Int30:Int32` · `Int31:Int32` · `Int32:Int32` · `Int33:Int32` · `Int34:Int32` · `Int35:Int32` · `Int36:Int32` · `Int37:Int32` · `Int38:Int32` · `Int39:Int32` · `Int40:Int32` · `Dec1:Decimal` · `Dec2:Decimal` · `Dec3:Decimal` · `Dec4:Decimal` · `Dec5:Decimal` · `Dec6:Decimal` · `Dec7:Decimal` · `Dec8:Decimal` · `Dec9:Decimal` · `Dec10:Decimal` · `Dec11:Decimal` · `Dec12:Decimal` · `Dec13:Decimal` · `Dec14:Decimal` · `Dec15:Decimal` · `Dec16:Decimal` · `Dec17:Decimal` · `Dec18:Decimal` · `Dec19:Decimal` · `Dec20:Decimal` · `Dec21:Decimal` · `Dec22:Decimal` · `Dec23:Decimal` · `Dec24:Decimal` · `Dec25:Decimal` · `Dec26:Decimal` · `Dec27:Decimal` · `Dec28:Decimal` · `Dec29:Decimal` · `Dec30:Decimal` · `Dec31:Decimal` · `Dec32:Decimal` · `Dec33:Decimal` · `Dec34:Decimal` · `Dec35:Decimal` · `Dec36:Decimal` · `Dec37:Decimal` · `Dec38:Decimal` · `Dec39:Decimal` · `Dec40:Decimal`

### Dept

`DeptID:Int32` · `Name:String`

### Excel

`ID:Int32` · `Field:String`

### ExcelDefault

`ID:Int32` · `Field:String` · `Default:String`

### Face

`ScaleID:String` · `PageID:Int32` · `KeyID:Int32` · `PLUID:Int32`

### FaceList

`ScaleID:String` · `Layout:String` · `PageMode:String`

### Label

`LabelID:Int32` · `Width:Int32` · `Height:Int32` · `Sort:Int32` · `Name:String` · `Text1:String` · `Text2:String` · `Text3:String` · `Text4:String` · `Text5:String` · `Text6:String` · `Text7:String` · `Text8:String` · `Text9:String` · `Text10:String` · `Text11:String` · `Text12:String` · `Text13:String` · `Text14:String` · `Text15:String` · `Text16:String` · `Version:Int32` · `Text17:String` · `Text18:String` · `Text19:String` · `Text20:String` · `Text21:String` · `Text22:String` · `Text23:String` · `Text24:String` · `Text25:String` · `Text26:String` · `Text27:String` · `Text28:String` · `Text29:String` · `Text30:String` · `Text31:String` · `Text32:String`

### LabelItem

`LabelID:Int32` · `SubID:Int32` · `Print:Int32` · `Angle:Int32` · `Font:Int32` · `Left:Int32` · `Top:Int32` · `Width:Int32` · `Height:Int32` · `Align:Int32` · `Flag1:Int32` · `Flag2:Int32` · `Flag3:Int32`

### Password

`ID:Int32` · `Pass:String`

### PLU

`PLUID:Int32` · `Valid:Boolean` · `Remark:Int32` · `Index:String` · `UnitID:Int32` · `Price:Decimal` · `Cost:Decimal` · `Tare:Decimal` · `BarF1:Int32` · `BarF2:Int32` · `BarT1:Int32` · `BarT2:Int32` · `LabelID1:Int32` · `LabelID2:Int32` · `ClassID:Int32` · `PS_SD:Int32` · `PS_ST:Int32` · `PS_PD:Int32` · `PS_PT:Int32` · `PS_UD:Int32` · `PC_SD:Int32` · `PC_ST:Int32` · `PC_PD:Int32` · `PC_PT:Int32` · `PC_UD:Int32` · `DF_U:Int32` · `DF_D:Int32` · `DF_UN:Decimal` · `DF_DN:Decimal` · `DA_Sort1:Int32` · `DA_Day1:Int32` · `DA_Up1:Decimal` · `DA_Dn1:Decimal` · `DA_Num1:Decimal` · `DA_Sort2:Int32` · `DA_Day2:Int32` · `DA_Up2:Decimal` · `DA_Dn2:Decimal` · `DA_Num2:Decimal` · `DA_Sort3:Int32` · `DA_Day3:Int32` · `DA_Up3:Decimal` · `DA_Dn3:Decimal` · `DA_Num3:Decimal` · `DA_Sort4:Int32` · `DA_Day4:Int32` · `DA_Up4:Decimal` · `DA_Dn4:Decimal` · `DA_Num4:Decimal` · `Name:String` · `Text1:String` · `Text2:String` · `Text3:String` · `Text4:String` · `Text5:String` · `Text6:String` · `Text7:String` · `TaxType:Int32` · `Tax:Int32` · `SspValue1:Int32` · `SspValue2:Int32` · `SspValue3:Int32` · `SspValue4:Int32` · `SType:Int32` · `ALPHA:String` · `Flag:Int32` · `Flag_Value:Int32` · `Bitmap:Int32`

### Salesman

`SalesmanID:Int32` · `Name:String` · `Password:String` · `Discount_Low:Int32` · `Discount_High:Int32` · `RightFB:Int32` · `Code:String`

### Spec

`SpecID:Int32` · `Value:Int32` · `Valid:Boolean`

### String

`StringID:Int32` · `Value:String` · `Valid:Boolean`

### Unit

`UnitID:Int32` · `Amount:String` · `Pamount:String` · `Name:String` · `Punit:Int32` · `Pack:Decimal` · `FlagP:Boolean` · `FlagA:Boolean`

### VIP

`BAR:String` · `PH:String` · `Point:Decimal` · `Discount:Int32`

## Report.mdb

### Device

`MAC:String` · `Name:String` · `GID:Int32` · `FIDed:Int32`

### Excel

`ID:Int32` · `Field:String`

### Expr

`ID:Int32` · `Not:Boolean` · `AndOr:String` · `Field:String` · `Op:String` · `Expr1:String` · `Expr2:String` · `Display:String`

### History

`FileName:String` · `Start:DateTime` · `End:DateTime`

### Log

`MAC:String` · `FID:Int32` · `DateTime:DateTime` · `SID:Int32` · `Salesman:Int32` · `DisRound:Decimal` · `Sfee:Decimal` · `Payment_Card:Decimal` · `Payment_Other_1:Decimal` · `Payment_Other_2:Decimal` · `Payment_Other_3:Decimal` · `Payment_Total:Decimal` · `Tax:Decimal` · `Cost:Decimal` · `SubNo:Int32` · `Alipay:Decimal` · `WXpay:Decimal` · `Epay2:Decimal` · `Epay3:Decimal` · `Epay4:Decimal` · `Epay5:Decimal` · `Epay6:Decimal` · `Epay7:Decimal`

### LogItem

`MAC:String` · `FID:Int32` · `SubID:Int32` · `Price:Decimal` · `PLU:Int32` · `Class:Int32` · `Dept:Int32` · `Cost:Decimal` · `Amount:Decimal` · `Unit:Int32` · `Type:Int32` · `Tax:Decimal` · `Text1:String` · `Text2:String` · `Text3:String` · `Text4:String` · `UnitPrice:Decimal` · `CoFID:Int32` · `PLUName:String` · `DateTime:DateTime`

### rLogsType

`TypeID:Int32` · `Name:String`

### rPLU

`PLUID:Int32` · `Valid:Boolean` · `Remark:Int32` · `Index:String` · `UnitID:Int32` · `Price:Decimal` · `Cost:Decimal` · `Tare:Decimal` · `BarF1:Int32` · `BarF2:Int32` · `BarT1:Int32` · `BarT2:Int32` · `LabelID1:Int32` · `LabelID2:Int32` · `ClassID:Int32` · `PS_SD:Int32` · `PS_ST:Int32` · `PS_PD:Int32` · `PS_PT:Int32` · `PS_UD:Int32` · `PC_SD:Int32` · `PC_ST:Int32` · `PC_PD:Int32` · `PC_PT:Int32` · `PC_UD:Int32` · `DF_U:Int32` · `DF_D:Int32` · `DF_UN:Decimal` · `DF_DN:Decimal` · `DA_Sort1:Int32` · `DA_Day1:Int32` · `DA_Up1:Decimal` · `DA_Dn1:Decimal` · `DA_Num1:Decimal` · `DA_Sort2:Int32` · `DA_Day2:Int32` · `DA_Up2:Decimal` · `DA_Dn2:Decimal` · `DA_Num2:Decimal` · `DA_Sort3:Int32` · `DA_Day3:Int32` · `DA_Up3:Decimal` · `DA_Dn3:Decimal` · `DA_Num3:Decimal` · `DA_Sort4:Int32` · `DA_Day4:Int32` · `DA_Up4:Decimal` · `DA_Dn4:Decimal` · `DA_Num4:Decimal` · `Name:String` · `Text1:String` · `Text2:String` · `Text3:String` · `Text4:String` · `Text5:String` · `Text6:String` · `Text7:String` · `TaxType:Int32` · `Tax:Int32` · `SspValue1:Int32` · `SspValue2:Int32` · `SspValue3:Int32` · `SspValue4:Int32` · `SType:Int32` · `ALPHA:String` · `Flag:Int32` · `Flag_Value:Int32` · `Bitmap:Int32`

### rStockType

`TypeID:Int32` · `Name:String`

### rType

`TypeID:Int32` · `Name:String`

### rUnit

`UnitID:Int32` · `Amount:String` · `Pamount:String` · `Name:String` · `Punit:Int32` · `Pack:Decimal` · `FlagP:Boolean` · `FlagA:Boolean`

### SGroup

`GID:Int32` · `Name:String`

### Stock

`GID:Int32` · `PLU:Int32` · `STakingTime:DateTime` · `Amount:Decimal` · `Unit:Int32` · `In_Amount:Decimal` · `Spoilage:Decimal` · `AmountSP:Decimal` · `UnitSP:Int32` · `In_AmountSP:Decimal` · `SpoilageSP:Decimal` · `In_Money:Decimal` · `Sped:Boolean` · `SafetyStock:Decimal` · `LowStock:Boolean` · `Order:Decimal` · `KID:Int32` · `KID_Time:DateTime`

### StockItem

`KID:Int32` · `GID:Int32` · `MAC:String` · `FID:Int32` · `SubID:Int32` · `DateTime:DateTime` · `Price:Decimal` · `PLU:Int32` · `Amount:Decimal` · `Unit:Int32` · `Type:Int32` · `UnitPrice:Decimal`
