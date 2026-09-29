using System;
using System.ComponentModel;
using System.Data;
using System.Data.OleDb;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.IO.Ports;
using System.Text;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;
using ECS.ReportDataSetTableAdapters;
using Microsoft.Reporting.WinForms;

namespace ECS;

public class ReportForm : Form
{
	private class SimComboVD_No
	{
		private int value;

		private string display;

		public int Value
		{
			get
			{
				return value;
			}
			set
			{
				this.value = value;
			}
		}

		public string Display
		{
			get
			{
				return display;
			}
			set
			{
				display = value;
			}
		}
	}

	private delegate void UploadReport_Log_Info_Tip_Callback(string Info);

	private delegate void UploadReport_Log_Error_Tip_Callback(string Error);

	private delegate void DataSet_RefreshCallback(string Type);

	private IContainer components;

	private BindingSource logBindingSource;

	private ReportDataSet reportDataSet;

	private BindingSource report_ColBindingSource;

	private UIDataSet uIDataSet;

	private BindingSource excelBindingSource;

	private PLUTableAdapter pluTableAdapter;

	private BindingSource deviceBindingSource;

	private BindingSource sGroupBindingSource;

	private SerialPort serialPort;

	private BindingSource logItemBindingSource;

	private ECS.ReportDataSetTableAdapters.ExcelTableAdapter excelTableAdapter;

	private ExprTableAdapter exprTableAdapter;

	private BindingSource exprBindingSource;

	private BindingSource deviceBindingSource1;

	private BindingSource sGroupBindingSource1;

	private BindingSource pluBindingSource;

	private StringTableAdapter stringTableAdapter;

	private TabControl Main_TabControl;

	private TabPage Sale_TabPage;

	private TabPage Analysis_TabPage;

	private TabControl Sale_TabControl;

	private TabPage Data_TabPage;

	private SplitContainer Data_SplitContainer;

	private SplitContainer Data_Upper_SplitContainer;

	private DataGridView tableDataGridView;

	private DataGridView reportDataGridView;

	private DataGridView reportItemDataGridView;

	private TabPage DataImport_TabPage;

	private SplitContainer splitContainer6;

	private ListView listView;

	private ColumnHeader fileNameColumnHeader;

	private ColumnHeader shopNameColumnHeader;

	private ColumnHeader machineNameColumnHeader;

	private ColumnHeader machineNumberColumnHeader;

	private ColumnHeader stockColumnHeader;

	private ColumnHeader timeColumnHeader;

	private ColumnHeader pathColumnHeader;

	private CheckBox subdirCheckBox;

	private Button folderButton;

	private Button importButton;

	private ProgressBar progressBar;

	private SplitContainer Analysis_SplitContainer;

	private TabControl Analysis_Left_TabControl;

	private TabPage Filter_TabPage;

	private SplitContainer splitContainer1;

	private DataGridView exprDataGridView;

	private BindingNavigator exprBindingNavigator;

	private ToolStripLabel bindingNavigatorCountItem;

	private ToolStripButton bindingNavigatorDeleteItem;

	private ToolStripButton bindingNavigatorMoveFirstItem;

	private ToolStripButton bindingNavigatorMovePreviousItem;

	private ToolStripSeparator bindingNavigatorSeparator;

	private ToolStripTextBox bindingNavigatorPositionItem;

	private ToolStripSeparator bindingNavigatorSeparator1;

	private ToolStripButton bindingNavigatorMoveNextItem;

	private ToolStripButton bindingNavigatorMoveLastItem;

	private ToolStripSeparator bindingNavigatorSeparator2;

	private ToolStripButton bindingNavigatorAddNewItem;

	private ToolStripButton editToolStripButton;

	private ToolStripButton exprClearToolStripButton;

	private ComboBox pluComboBox;

	private Button filterButton;

	private CheckBox pluCheckBox;

	private CheckBox groupCheckBox;

	private CheckBox timeCheckBox;

	private CheckBox tableCheckBox;

	private ComboBox deviceComboBox;

	private ComboBox groupComboBox;

	private Label fromLabel;

	private Label toLabel;

	private DateTimePicker fromTimePicker;

	private DateTimePicker fromDatePicker;

	private DateTimePicker toDatePicker;

	private DateTimePicker toTimePicker;

	private TabPage Analysis_ImExport_TabPage;

	private TabControl Analysis_Right_TabControl;

	private TabPage List_TabPage;

	private TabPage Report_TabPage;

	private DataGridView resultDataGridView;

	private ComboBox baudComboBox;

	private ComboBox serialComboBox;

	private CheckBox reCheckBox;

	private Button openButton;

	private SplitContainer splitContainer3;

	private DataGridView excelDataGridView;

	private DataGridViewComboBoxColumn fieldColumn;

	private DataGridViewTextBoxColumn idDataGridViewTextBoxColumn1;

	private BindingNavigator excelBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem2;

	private ToolStripLabel bindingNavigatorCountItem2;

	private ToolStripButton bindingNavigatorDeleteItem2;

	private ToolStripButton bindingNavigatorMoveFirstItem2;

	private ToolStripButton bindingNavigatorMovePreviousItem2;

	private ToolStripSeparator bindingNavigatorSeparator6;

	private ToolStripTextBox bindingNavigatorPositionItem2;

	private ToolStripSeparator bindingNavigatorSeparator7;

	private ToolStripButton bindingNavigatorMoveNextItem2;

	private ToolStripButton bindingNavigatorMoveLastItem2;

	private ToolStripSeparator bindingNavigatorSeparator8;

	private ToolStripButton addAllToolStripButton;

	private ToolStripButton clearToolStripButton;

	private Button exeButton;

	private TabPage Stock_TabPage;

	private DeviceTableAdapter deviceTableAdapter;

	private LogTableAdapter logTableAdapter;

	private PrintDialog printDialog1;

	private BindingSource sGroupBindingSource2;

	private SGroupTableAdapter sGroupTableAdapter;

	private BindingSource unitBindingSource;

	private LogItemTableAdapter logItemTableAdapter;

	private StockItemTableAdapter stockItemTableAdapter;

	private StockTableAdapter stockTableAdapter;

	private ECSDataSet ecsDataSet;

	private DataGridViewComboBoxColumn dataGridViewTextBoxColumn2;

	private DataGridViewCheckBoxColumn dataGridViewCheckBoxColumn1;

	private DataGridViewTextBoxColumn DisplayColumn;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private ColumnHeader macColumnHeader;

	private GroupBox importFile_GroupBox;

	private Button allDefaultStock_Button;

	private Button specifyStock_Button;

	private TextBox ReportInfo_TextBox;

	private TextBox ReportError_TextBox;

	private Button fileButton;

	private Button clearButton;

	private CheckBox allCheckBox;

	private GroupBox importRS232_GroupBox;

	private DataGridView sGroupDataGridView;

	private BindingSource stockItemBindingSource;

	private BindingSource stockBindingSource;

	private DataGridView stockItemDataGridView;

	private SplitContainer splitContainer2;

	private SplitContainer splitContainer4;

	private BindingNavigator stockItemBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem3;

	private ToolStripLabel bindingNavigatorCountItem3;

	private ToolStripButton bindingNavigatorDeleteItem3;

	private ToolStripButton bindingNavigatorMoveFirstItem3;

	private ToolStripButton bindingNavigatorMovePreviousItem3;

	private ToolStripSeparator bindingNavigatorSeparator5;

	private ToolStripTextBox bindingNavigatorPositionItem3;

	private ToolStripSeparator bindingNavigatorSeparator9;

	private ToolStripButton bindingNavigatorMoveNextItem3;

	private ToolStripButton bindingNavigatorMoveLastItem3;

	private ToolStripSeparator bindingNavigatorSeparator10;

	private BindingNavigator stockBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem4;

	private ToolStripLabel bindingNavigatorCountItem4;

	private ToolStripButton bindingNavigatorDeleteItem4;

	private ToolStripButton bindingNavigatorMoveFirstItem4;

	private ToolStripButton bindingNavigatorMovePreviousItem4;

	private ToolStripSeparator bindingNavigatorSeparator11;

	private ToolStripTextBox bindingNavigatorPositionItem4;

	private ToolStripSeparator bindingNavigatorSeparator12;

	private ToolStripButton bindingNavigatorMoveNextItem4;

	private ToolStripButton bindingNavigatorMoveLastItem4;

	private ToolStripSeparator bindingNavigatorSeparator13;

	private BindingNavigator resultBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem1;

	private ToolStripLabel bindingNavigatorCountItem1;

	private ToolStripButton bindingNavigatorDeleteItem1;

	private ToolStripButton bindingNavigatorMoveFirstItem1;

	private ToolStripButton bindingNavigatorMovePreviousItem1;

	private ToolStripSeparator bindingNavigatorSeparator3;

	private ToolStripTextBox bindingNavigatorPositionItem1;

	private ToolStripSeparator bindingNavigatorSeparator4;

	private ToolStripButton bindingNavigatorMoveNextItem1;

	private ToolStripButton bindingNavigatorMoveLastItem1;

	private ToolStripSeparator bindingNavigatorSeparator14;

	private BindingNavigator sGroupBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem5;

	private ToolStripLabel bindingNavigatorCountItem5;

	private ToolStripButton bindingNavigatorDeleteItem5;

	private ToolStripButton bindingNavigatorMoveFirstItem5;

	private ToolStripButton bindingNavigatorMovePreviousItem5;

	private ToolStripSeparator bindingNavigatorSeparator15;

	private ToolStripTextBox bindingNavigatorPositionItem5;

	private ToolStripSeparator bindingNavigatorSeparator16;

	private ToolStripButton bindingNavigatorMoveNextItem5;

	private ToolStripButton bindingNavigatorMoveLastItem5;

	private ToolStripSeparator bindingNavigatorSeparator17;

	private BindingNavigator reportBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem7;

	private ToolStripLabel bindingNavigatorCountItem7;

	private ToolStripButton bindingNavigatorDeleteItem7;

	private ToolStripButton bindingNavigatorMoveFirstItem7;

	private ToolStripButton bindingNavigatorMovePreviousItem7;

	private ToolStripSeparator bindingNavigatorSeparator21;

	private ToolStripTextBox bindingNavigatorPositionItem7;

	private ToolStripSeparator bindingNavigatorSeparator22;

	private ToolStripButton bindingNavigatorMoveNextItem7;

	private ToolStripButton bindingNavigatorMoveLastItem7;

	private ToolStripSeparator bindingNavigatorSeparator23;

	private BindingNavigator reportItemBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem6;

	private ToolStripLabel bindingNavigatorCountItem6;

	private ToolStripButton bindingNavigatorDeleteItem6;

	private ToolStripButton bindingNavigatorMoveFirstItem6;

	private ToolStripButton bindingNavigatorMovePreviousItem6;

	private ToolStripSeparator bindingNavigatorSeparator18;

	private ToolStripTextBox bindingNavigatorPositionItem6;

	private ToolStripSeparator bindingNavigatorSeparator19;

	private ToolStripButton bindingNavigatorMoveNextItem6;

	private ToolStripButton bindingNavigatorMoveLastItem6;

	private ToolStripSeparator bindingNavigatorSeparator20;

	private BindingNavigator tableBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem8;

	private ToolStripLabel bindingNavigatorCountItem8;

	private ToolStripButton bindingNavigatorDeleteItem8;

	private ToolStripButton bindingNavigatorMoveFirstItem8;

	private ToolStripButton bindingNavigatorMovePreviousItem8;

	private ToolStripSeparator bindingNavigatorSeparator24;

	private ToolStripTextBox bindingNavigatorPositionItem8;

	private ToolStripSeparator bindingNavigatorSeparator25;

	private ToolStripButton bindingNavigatorMoveNextItem8;

	private ToolStripButton bindingNavigatorMoveLastItem8;

	private ToolStripSeparator bindingNavigatorSeparator26;

	private ToolStripButton editTolStripButton;

	private ToolStripButton stockItemSaveToolStripButton;

	private ToolStripButton stockSaveToolStripButton;

	private ToolStripButton clearIn_ToolStripButton;

	private DataGridView stockDataGridView;

	private ToolStripButton clearSP_ToolStripButton;

	private DataGridViewTextBoxColumn mACDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn nameDataGridViewTextBoxColumn1;

	private DataGridViewComboBoxColumn gIDDataGridViewComboBoxColumn1;

	private DataGridViewTextBoxColumn gIDDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn nameDataGridViewTextBoxColumn2;

	private rPLUTableAdapter rPLUTableAdapter;

	private rUnitTableAdapter rUnitTableAdapter;

	private ToolStripButton clearOrder_ToolStripButton;

	private ToolStripButton stockItemSaveAllToolStripButton;

	private ToolStripButton stockSaveAllToolStripButton;

	private ToolStripButton clearSpoilage_ToolStripButton;

	private Button filterDoButton;

	private ReportViewer reportViewer1;

	private GroupBox groupBox1;

	private ToolStripButton editStock_ToolStripButton;

	private ToolStripSeparator toolStripSeparator1;

	private SplitContainer MF_SplitContainer;

	private SplitContainer MF_D_SplitContainer;

	private BindingNavigator MFD_L_BindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem10;

	private ToolStripLabel toolStripLabel1;

	private ToolStripButton bindingNavigatorDeleteItem10;

	private ToolStripButton bindingNavigatorMoveFirstItem10;

	private ToolStripButton bindingNavigatorMovePreviousItem10;

	private ToolStripSeparator toolStripSeparator2;

	private ToolStripTextBox toolStripTextBox1;

	private ToolStripSeparator toolStripSeparator3;

	private ToolStripButton bindingNavigatorMoveNextItem10;

	private ToolStripButton bindingNavigatorMoveLastItem10;

	private ToolStripSeparator toolStripSeparator4;

	private BindingNavigator MFD_R_BindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem11;

	private ToolStripLabel toolStripLabel2;

	private ToolStripButton bindingNavigatorDeleteItem11;

	private ToolStripButton bindingNavigatorMoveFirstItem11;

	private ToolStripButton bindingNavigatorMovePreviousItem11;

	private ToolStripSeparator toolStripSeparator5;

	private ToolStripTextBox toolStripTextBox2;

	private ToolStripSeparator toolStripSeparator6;

	private ToolStripButton bindingNavigatorMoveNextItem11;

	private ToolStripButton bindingNavigatorMoveLastItem11;

	private ToolStripSeparator toolStripSeparator7;

	private DataGridView allLog_DataGridView;

	private DataGridView allStock_DataGridView;

	private BindingSource allStockbindingSource;

	private BindingSource allLogsbindingSource;

	private AllLogsTableAdapter allLogsTableAdapter;

	private AllStocksTableAdapter allStocksTableAdapter;

	private DataGridViewTextBoxColumn kIDDataGridViewTextBoxColumn4;

	private DataGridViewTextBoxColumn kIDTimeDataGridViewTextBoxColumn4;

	private DataGridViewTextBoxColumn gIDDataGridViewTextBoxColumn4;

	private DataGridViewTextBoxColumn gIDDataGridViewComboBoxColumn4;

	private DataGridViewTextBoxColumn pLUDataGridViewTextBoxColumn4;

	private DataGridViewTextBoxColumn pLUDataGridViewComboBoxColumn4;

	private DataGridViewTextBoxColumn unitDataGridViewTextBoxColumn4;

	private DataGridViewTextBoxColumn unitDataGridViewComboBoxColumn4;

	private DataGridViewTextBoxColumn amountDataGridViewTextBoxColumn4;

	private DataGridViewTextBoxColumn sTakingTimeDataGridViewTextBoxColumn4;

	private DataGridViewTextBoxColumn spoilageDataGridViewTextBoxColumn4;

	private DataGridViewTextBoxColumn inAmountDataGridViewTextBoxColumn4;

	private DataGridViewTextBoxColumn inMoneyDataGridViewTextBoxColumn4;

	private DataGridViewTextBoxColumn safetyStockDataGridViewTextBoxColumn4;

	private DataGridViewCheckBoxColumn lowStockDataGridViewCheckBoxColumn4;

	private DataGridViewTextBoxColumn orderDataGridViewTextBoxColumn4;

	private ToolStripButton list_L_toolStripButton;

	private ToolStripButton list_R_toolStripButton;

	private DataGridViewTextBoxColumn pLUDataGridViewTextBoxColumn2_1;

	private DataGridViewComboBoxColumn pLUDataGridViewComboBoxColumn2_1;

	private DataGridViewTextBoxColumn unitDataGridViewTextBoxColumn2_1;

	private DataGridViewComboBoxColumn unitDataGridViewComboBoxColumn2_1;

	private DataGridViewTextBoxColumn amountDataGridViewTextBoxColumn2_1;

	private DataGridViewTextBoxColumn sTakingTimeDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn spoilageDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn inAmountDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn amountSPDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn unitSPDataGridViewTextBoxColumn2;

	private DataGridViewComboBoxColumn unitSPDataGridViewComboBoxColumn2;

	private DataGridViewTextBoxColumn spoilageSPDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn inAmountSPDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn inMoneyDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn safetyStockDataGridViewTextBoxColumn2;

	private DataGridViewCheckBoxColumn lowStockDataGridViewCheckBoxColumn2;

	private DataGridViewTextBoxColumn orderDataGridViewTextBoxColumn2;

	private ToolStripButton editStock2_ToolStripButton;

	private ToolStrip shrink_ToolStrip;

	private ToolStripButton shrink_R_ToolStripButton;

	private ToolStrip MFD_R_ToolStrip;

	private ToolStripLabel stock_ToolStripLabel;

	private ToolStripButton expand_R_toolStripButton;

	private ToolStrip MFD_L_ToolStrip;

	private ToolStripLabel log_ToolStripLabel;

	private ToolStripButton expand_L_toolStripButton;

	private ToolStripLabel report_ToolStripLabel;

	private rLogsTypeTableAdapter rLogsTypeTableAdapter;

	private ToolStripButton ExcelSCV_ToolStripButton;

	private ToolStripButton ExcelSCV2_ToolStripButton;

	private ToolStripButton bindingNavigatorFilter;

	private ToolStripButton FilterAdd_ToolStripButton;

	private rStockTypeTableAdapter rStockTypeTableAdapter;

	private DataGridViewTextBoxColumn mACDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn nameDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn fIDDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn dateTimeDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn sIDDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn salesmanDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn subIDDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn typeDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn typeDataGridViewComboBoxColumn3;

	private DataGridViewTextBoxColumn pLUDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn pLUDataGridViewComboBoxColumn3;

	private DataGridViewTextBoxColumn unitDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn unitDataGridViewComboBoxColumn3;

	private DataGridViewTextBoxColumn amountDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn unitPriceDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn priceDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn costDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn taxDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn classDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn deptDataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn text1DataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn text2DataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn text3DataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn text4DataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn coFIDDataGridViewTextBoxColumn3;

	private SplitContainer splitContainer5;

	private BindingSource resultLogItemBindingSource;

	private ResultLogItemTableAdapter resultLogItemTableAdapter;

	private ResultLogTableAdapter resultLogTableAdapter;

	private BindingSource resultLogBindingSource;

	private DataGridView dataGridView1;

	private BindingNavigator resultlogBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem9;

	private ToolStripLabel bindingNavigatorCountItem9;

	private ToolStripButton bindingNavigatorDeleteItem9;

	private ToolStripButton bindingNavigatorMoveFirstItem9;

	private ToolStripButton bindingNavigatorMovePreviousItem9;

	private ToolStripSeparator bindingNavigatorSeparator27;

	private ToolStripTextBox bindingNavigatorPositionItem9;

	private ToolStripSeparator bindingNavigatorSeparator28;

	private ToolStripButton bindingNavigatorMoveNextItem9;

	private ToolStripButton bindingNavigatorMoveLastItem9;

	private ToolStripSeparator bindingNavigatorSeparator29;

	private BindingSource bindingSource1;

	private ComboBox fieldComboBox;

	private ComboBox opComboBox;

	private CheckBox spf_CheckBox;

	private NumericUpDown op1_NumericUpDown;

	private NumericUpDown op2_NumericUpDown;

	private BindingSource report_ColBindingSource2;

	private BindingSource logTypeBindingSource;

	private BindingSource logType2BindingSource;

	private BindingSource stockTypeBindingSource;

	private DataGridViewTextBoxColumn subIDDataGridViewTextBoxColumn1;

	private DataGridViewComboBoxColumn typeDataGridViewComboBoxColumn1;

	private DataGridViewTextBoxColumn pLUDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn pLUDataGridViewComboBoxColumn1;

	private DataGridViewTextBoxColumn unitDataGridViewTextBoxColumn1;

	private DataGridViewComboBoxColumn unitDataGridViewComboBoxColumn1;

	private DataGridViewTextBoxColumn amountDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn unitPriceDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn priceDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn taxDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn costDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn classDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn deptDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn text1Column1;

	private DataGridViewTextBoxColumn text2Column1;

	private DataGridViewTextBoxColumn text3Column1;

	private DataGridViewTextBoxColumn text4Column1;

	private DataGridViewTextBoxColumn coFIDDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn macDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn nameDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn fidDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn dateTimeDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn sidDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn salesmanDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn subidDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn pluDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn pLUDataGridViewComboBoxColumn;

	private DataGridViewTextBoxColumn amountDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn unitDataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn unitDataGridViewComboBoxColumn;

	private DataGridViewTextBoxColumn unitPriceDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn priceDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn deptDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn classDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn costDataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn typeDataGridViewComboBoxColumn;

	private DataGridViewTextBoxColumn cofidDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn taxDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn _Text1Column;

	private DataGridViewTextBoxColumn _Text2Column;

	private DataGridViewTextBoxColumn _Text3Column;

	private DataGridViewTextBoxColumn _Text4Column;

	private DataGridViewTextBoxColumn mACDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn fIDDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn subIDDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn TypeDataGridViewTextBoxColumn2;

	private DataGridViewComboBoxColumn typeDataGridViewComboBoxColumn2;

	private DataGridViewTextBoxColumn dateTimeDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn pLUDataGridViewTextBoxColumn2;

	private DataGridViewComboBoxColumn pLUDataGridViewComboBoxColumn2;

	private DataGridViewTextBoxColumn unitPriceDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn amountDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn unitDataGridViewTextBoxColumn2;

	private DataGridViewComboBoxColumn unitDataGridViewComboBoxColumn2;

	private DataGridViewTextBoxColumn priceDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn mACDataGridViewTextBoxColumn4;

	private DataGridViewTextBoxColumn fIDDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn dateTimeDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn sIDDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn subNoDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn paymentTotalDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn taxDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn costDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn salesmanDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn disRoundDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn epay0DataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn epay1DataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn epay2DataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn epay3DataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn epay4DataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn epay5DataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn epay6DataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn epay7DataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn paymentCardDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn paymentOther1DataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn paymentOther2DataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn paymentOther3DataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn sfeeDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn mACDataGridViewTextBoxColumn5;

	private DataGridViewTextBoxColumn nameDataGridViewTextBoxColumn5;

	private DataGridViewTextBoxColumn fIDDataGridViewTextBoxColumn5;

	private DataGridViewTextBoxColumn dateTimeDataGridViewTextBoxColumn5;

	private DataGridViewTextBoxColumn sIDDataGridViewTextBoxColumn5;

	private DataGridViewTextBoxColumn subNoDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn paymentTotalDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn taxDataGridViewTextBoxColumn5;

	private DataGridViewTextBoxColumn costDataGridViewTextBoxColumn5;

	private DataGridViewTextBoxColumn salesmanDataGridViewTextBoxColumn5;

	private DataGridViewTextBoxColumn disRoundDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn epay0DataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn epay1DataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn epay2DataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn epay3DataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn epay4DataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn epay5DataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn epay6DataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn epay7DataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn paymentCardDataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn paymentOther1DataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn paymentOther2DataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn paymentOther3DataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn sfeeDataGridViewTextBoxColumn2;

	private SimComboVD_No[] pluDefault;

	private bool DataSet_NeedRefresh_Report_Dock = true;

	private bool DataSet_NeedRefresh_Report = true;

	private bool DataSet_NeedRefresh_PLU = true;

	private bool NeedCopyPU = true;

	private bool DataSet_OK;

	private bool FormLoad_OK;

	private string StockItemSave_Filter = "";

	public bool mf_Docked;

	public bool mf_Docking;

	public Panel mf_Docking_Panel;

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		this.components = new System.ComponentModel.Container();
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.ReportForm));
		System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle = new System.Windows.Forms.DataGridViewCellStyle();
		Microsoft.Reporting.WinForms.ReportDataSource reportDataSource = new Microsoft.Reporting.WinForms.ReportDataSource();
		Microsoft.Reporting.WinForms.ReportDataSource reportDataSource2 = new Microsoft.Reporting.WinForms.ReportDataSource();
		this.splitContainer6 = new System.Windows.Forms.SplitContainer();
		this.listView = new System.Windows.Forms.ListView();
		this.fileNameColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.macColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.stockColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.shopNameColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.machineNameColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.machineNumberColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.timeColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.pathColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.importRS232_GroupBox = new System.Windows.Forms.GroupBox();
		this.serialComboBox = new System.Windows.Forms.ComboBox();
		this.baudComboBox = new System.Windows.Forms.ComboBox();
		this.openButton = new System.Windows.Forms.Button();
		this.reCheckBox = new System.Windows.Forms.CheckBox();
		this.ReportInfo_TextBox = new System.Windows.Forms.TextBox();
		this.ReportError_TextBox = new System.Windows.Forms.TextBox();
		this.importFile_GroupBox = new System.Windows.Forms.GroupBox();
		this.progressBar = new System.Windows.Forms.ProgressBar();
		this.importButton = new System.Windows.Forms.Button();
		this.allDefaultStock_Button = new System.Windows.Forms.Button();
		this.folderButton = new System.Windows.Forms.Button();
		this.specifyStock_Button = new System.Windows.Forms.Button();
		this.clearButton = new System.Windows.Forms.Button();
		this.fileButton = new System.Windows.Forms.Button();
		this.allCheckBox = new System.Windows.Forms.CheckBox();
		this.subdirCheckBox = new System.Windows.Forms.CheckBox();
		this.resultLogItemBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.reportDataSet = new ECS.ReportDataSet();
		this.resultLogBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.Data_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.Data_Upper_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.tableDataGridView = new System.Windows.Forms.DataGridView();
		this.mACDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.nameDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.gIDDataGridViewComboBoxColumn1 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.sGroupBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.deviceBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.tableBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem8 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem8 = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorDeleteItem8 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem8 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem8 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator24 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem8 = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator25 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem8 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem8 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator26 = new System.Windows.Forms.ToolStripSeparator();
		this.editTolStripButton = new System.Windows.Forms.ToolStripButton();
		this.reportDataGridView = new System.Windows.Forms.DataGridView();
		this.mACDataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.fIDDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dateTimeDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sIDDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.subNoDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.paymentTotalDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.taxDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.costDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.salesmanDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.disRoundDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay0DataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay1DataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay2DataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay3DataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay4DataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay5DataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay6DataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay7DataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.paymentCardDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.paymentOther1DataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.paymentOther2DataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.paymentOther3DataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sfeeDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.logBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.reportBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem7 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem7 = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorDeleteItem7 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem7 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem7 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator21 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem7 = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator22 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem7 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem7 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator23 = new System.Windows.Forms.ToolStripSeparator();
		this.reportItemDataGridView = new System.Windows.Forms.DataGridView();
		this.subIDDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.typeDataGridViewComboBoxColumn1 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.logTypeBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.pLUDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUDataGridViewComboBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitDataGridViewComboBoxColumn1 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.unitBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.ecsDataSet = new ECS.ECSDataSet();
		this.amountDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitPriceDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.priceDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.taxDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.costDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.classDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.deptDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.text1Column1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.text2Column1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.text3Column1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.text4Column1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.coFIDDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.logItemBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.reportItemBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem6 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem6 = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorDeleteItem6 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem6 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem6 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator18 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem6 = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator19 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem6 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem6 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator20 = new System.Windows.Forms.ToolStripSeparator();
		this.pluBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.Analysis_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.Analysis_Left_TabControl = new System.Windows.Forms.TabControl();
		this.Filter_TabPage = new System.Windows.Forms.TabPage();
		this.splitContainer1 = new System.Windows.Forms.SplitContainer();
		this.exprDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.dataGridViewCheckBoxColumn1 = new System.Windows.Forms.DataGridViewCheckBoxColumn();
		this.DisplayColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.exprBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.exprBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.editToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.exprClearToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.groupBox1 = new System.Windows.Forms.GroupBox();
		this.spf_CheckBox = new System.Windows.Forms.CheckBox();
		this.op1_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.op2_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.opComboBox = new System.Windows.Forms.ComboBox();
		this.fieldComboBox = new System.Windows.Forms.ComboBox();
		this.report_ColBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.uIDataSet = new ECS.UIDataSet();
		this.timeCheckBox = new System.Windows.Forms.CheckBox();
		this.pluComboBox = new System.Windows.Forms.ComboBox();
		this.filterButton = new System.Windows.Forms.Button();
		this.toTimePicker = new System.Windows.Forms.DateTimePicker();
		this.toDatePicker = new System.Windows.Forms.DateTimePicker();
		this.fromDatePicker = new System.Windows.Forms.DateTimePicker();
		this.pluCheckBox = new System.Windows.Forms.CheckBox();
		this.fromTimePicker = new System.Windows.Forms.DateTimePicker();
		this.groupCheckBox = new System.Windows.Forms.CheckBox();
		this.toLabel = new System.Windows.Forms.Label();
		this.fromLabel = new System.Windows.Forms.Label();
		this.tableCheckBox = new System.Windows.Forms.CheckBox();
		this.groupComboBox = new System.Windows.Forms.ComboBox();
		this.sGroupBindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.deviceComboBox = new System.Windows.Forms.ComboBox();
		this.deviceBindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.filterDoButton = new System.Windows.Forms.Button();
		this.Analysis_ImExport_TabPage = new System.Windows.Forms.TabPage();
		this.splitContainer3 = new System.Windows.Forms.SplitContainer();
		this.excelDataGridView = new System.Windows.Forms.DataGridView();
		this.fieldColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.report_ColBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.idDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.excelBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.excelBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem2 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem2 = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorDeleteItem2 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem2 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem2 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator6 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem2 = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator7 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem2 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem2 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator8 = new System.Windows.Forms.ToolStripSeparator();
		this.addAllToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.clearToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.exeButton = new System.Windows.Forms.Button();
		this.Analysis_Right_TabControl = new System.Windows.Forms.TabControl();
		this.List_TabPage = new System.Windows.Forms.TabPage();
		this.splitContainer5 = new System.Windows.Forms.SplitContainer();
		this.dataGridView1 = new System.Windows.Forms.DataGridView();
		this.mACDataGridViewTextBoxColumn5 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.nameDataGridViewTextBoxColumn5 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.fIDDataGridViewTextBoxColumn5 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dateTimeDataGridViewTextBoxColumn5 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sIDDataGridViewTextBoxColumn5 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.subNoDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.paymentTotalDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.taxDataGridViewTextBoxColumn5 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.costDataGridViewTextBoxColumn5 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.salesmanDataGridViewTextBoxColumn5 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.disRoundDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay0DataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay1DataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay2DataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay3DataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay4DataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay5DataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay6DataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.epay7DataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.paymentCardDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.paymentOther1DataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.paymentOther2DataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.paymentOther3DataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sfeeDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.resultlogBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem9 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem9 = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorDeleteItem9 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem9 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem9 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator27 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem9 = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator28 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem9 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem9 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator29 = new System.Windows.Forms.ToolStripSeparator();
		this.resultDataGridView = new System.Windows.Forms.DataGridView();
		this.macDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.nameDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.fidDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dateTimeDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sidDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.salesmanDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.subidDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pluDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUDataGridViewComboBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.amountDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitDataGridViewComboBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.unitPriceDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.priceDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.deptDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.classDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.costDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.typeDataGridViewComboBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.logType2BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.cofidDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.taxDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this._Text1Column = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this._Text2Column = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this._Text3Column = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this._Text4Column = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.resultBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem1 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem1 = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorDeleteItem1 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem1 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem1 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator3 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem1 = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator4 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem1 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem1 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator14 = new System.Windows.Forms.ToolStripSeparator();
		this.Report_TabPage = new System.Windows.Forms.TabPage();
		this.reportViewer1 = new Microsoft.Reporting.WinForms.ReportViewer();
		this.splitContainer2 = new System.Windows.Forms.SplitContainer();
		this.splitContainer4 = new System.Windows.Forms.SplitContainer();
		this.sGroupDataGridView = new System.Windows.Forms.DataGridView();
		this.gIDDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.nameDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sGroupBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.sGroupBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorCountItem5 = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorMoveFirstItem5 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem5 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator15 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem5 = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator16 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem5 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem5 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator17 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorAddNewItem5 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorDeleteItem5 = new System.Windows.Forms.ToolStripButton();
		this.stockItemDataGridView = new System.Windows.Forms.DataGridView();
		this.mACDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.fIDDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.subIDDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.TypeDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.typeDataGridViewComboBoxColumn2 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.stockTypeBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.dateTimeDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUDataGridViewComboBoxColumn2 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.unitPriceDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.amountDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitDataGridViewComboBoxColumn2 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.priceDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.stockItemBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.stockItemBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorCountItem3 = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorDeleteItem3 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem3 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem3 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator5 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem3 = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator9 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem3 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem3 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator10 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorAddNewItem3 = new System.Windows.Forms.ToolStripButton();
		this.stockItemSaveToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.stockItemSaveAllToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorFilter = new System.Windows.Forms.ToolStripButton();
		this.FilterAdd_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.stockDataGridView = new System.Windows.Forms.DataGridView();
		this.pLUDataGridViewTextBoxColumn2_1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUDataGridViewComboBoxColumn2_1 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.unitDataGridViewTextBoxColumn2_1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitDataGridViewComboBoxColumn2_1 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.amountDataGridViewTextBoxColumn2_1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sTakingTimeDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.spoilageDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.inAmountDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.amountSPDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitSPDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitSPDataGridViewComboBoxColumn2 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.spoilageSPDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.inAmountSPDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.inMoneyDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.safetyStockDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.lowStockDataGridViewCheckBoxColumn2 = new System.Windows.Forms.DataGridViewCheckBoxColumn();
		this.orderDataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.stockBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.stockBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem4 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem4 = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorDeleteItem4 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem4 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem4 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator11 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem4 = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator12 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem4 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem4 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator13 = new System.Windows.Forms.ToolStripSeparator();
		this.editStock_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.ExcelSCV_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.clearSpoilage_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.clearIn_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.clearOrder_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.clearSP_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.stockSaveToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.stockSaveAllToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.pluTableAdapter = new ECS.ECSDataSetTableAdapters.PLUTableAdapter();
		this.serialPort = new System.IO.Ports.SerialPort(this.components);
		this.stringTableAdapter = new ECS.ECSDataSetTableAdapters.StringTableAdapter();
		this.Main_TabControl = new System.Windows.Forms.TabControl();
		this.Sale_TabPage = new System.Windows.Forms.TabPage();
		this.Sale_TabControl = new System.Windows.Forms.TabControl();
		this.Data_TabPage = new System.Windows.Forms.TabPage();
		this.DataImport_TabPage = new System.Windows.Forms.TabPage();
		this.Analysis_TabPage = new System.Windows.Forms.TabPage();
		this.Stock_TabPage = new System.Windows.Forms.TabPage();
		this.printDialog1 = new System.Windows.Forms.PrintDialog();
		this.MF_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.shrink_ToolStrip = new System.Windows.Forms.ToolStrip();
		this.shrink_R_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.report_ToolStripLabel = new System.Windows.Forms.ToolStripLabel();
		this.MF_D_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.allLog_DataGridView = new System.Windows.Forms.DataGridView();
		this.mACDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.nameDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.fIDDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dateTimeDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sIDDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.salesmanDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.subIDDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.typeDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.typeDataGridViewComboBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUDataGridViewComboBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitDataGridViewComboBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.amountDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitPriceDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.priceDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.costDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.taxDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.classDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.deptDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.text1DataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.text2DataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.text3DataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.text4DataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.coFIDDataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.allLogsbindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.MFD_L_BindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem10 = new System.Windows.Forms.ToolStripButton();
		this.toolStripLabel1 = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorDeleteItem10 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem10 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem10 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripTextBox1 = new System.Windows.Forms.ToolStripTextBox();
		this.toolStripSeparator3 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem10 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem10 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator4 = new System.Windows.Forms.ToolStripSeparator();
		this.list_L_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.MFD_L_ToolStrip = new System.Windows.Forms.ToolStrip();
		this.log_ToolStripLabel = new System.Windows.Forms.ToolStripLabel();
		this.expand_L_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.allStock_DataGridView = new System.Windows.Forms.DataGridView();
		this.kIDDataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.kIDTimeDataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.gIDDataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.gIDDataGridViewComboBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUDataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUDataGridViewComboBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitDataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitDataGridViewComboBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.amountDataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.sTakingTimeDataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.spoilageDataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.inAmountDataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.inMoneyDataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.safetyStockDataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.lowStockDataGridViewCheckBoxColumn4 = new System.Windows.Forms.DataGridViewCheckBoxColumn();
		this.orderDataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.allStockbindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.MFD_R_BindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem11 = new System.Windows.Forms.ToolStripButton();
		this.toolStripLabel2 = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorDeleteItem11 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem11 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem11 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator5 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripTextBox2 = new System.Windows.Forms.ToolStripTextBox();
		this.toolStripSeparator6 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem11 = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem11 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator7 = new System.Windows.Forms.ToolStripSeparator();
		this.list_R_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.editStock2_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.ExcelSCV2_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.MFD_R_ToolStrip = new System.Windows.Forms.ToolStrip();
		this.stock_ToolStripLabel = new System.Windows.Forms.ToolStripLabel();
		this.expand_R_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.excelTableAdapter = new ECS.ReportDataSetTableAdapters.ExcelTableAdapter();
		this.exprTableAdapter = new ECS.ReportDataSetTableAdapters.ExprTableAdapter();
		this.deviceTableAdapter = new ECS.ReportDataSetTableAdapters.DeviceTableAdapter();
		this.logTableAdapter = new ECS.ReportDataSetTableAdapters.LogTableAdapter();
		this.sGroupTableAdapter = new ECS.ReportDataSetTableAdapters.SGroupTableAdapter();
		this.logItemTableAdapter = new ECS.ReportDataSetTableAdapters.LogItemTableAdapter();
		this.stockItemTableAdapter = new ECS.ReportDataSetTableAdapters.StockItemTableAdapter();
		this.stockTableAdapter = new ECS.ReportDataSetTableAdapters.StockTableAdapter();
		this.rPLUTableAdapter = new ECS.ReportDataSetTableAdapters.rPLUTableAdapter();
		this.rUnitTableAdapter = new ECS.ReportDataSetTableAdapters.rUnitTableAdapter();
		this.allLogsTableAdapter = new ECS.ReportDataSetTableAdapters.AllLogsTableAdapter();
		this.allStocksTableAdapter = new ECS.ReportDataSetTableAdapters.AllStocksTableAdapter();
		this.rLogsTypeTableAdapter = new ECS.ReportDataSetTableAdapters.rLogsTypeTableAdapter();
		this.rStockTypeTableAdapter = new ECS.ReportDataSetTableAdapters.rStockTypeTableAdapter();
		this.resultLogItemTableAdapter = new ECS.ReportDataSetTableAdapters.ResultLogItemTableAdapter();
		this.resultLogTableAdapter = new ECS.ReportDataSetTableAdapters.ResultLogTableAdapter();
		this.bindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.splitContainer6.Panel1.SuspendLayout();
		this.splitContainer6.Panel2.SuspendLayout();
		this.splitContainer6.SuspendLayout();
		this.importRS232_GroupBox.SuspendLayout();
		this.importFile_GroupBox.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.resultLogItemBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.resultLogBindingSource).BeginInit();
		this.Data_SplitContainer.Panel1.SuspendLayout();
		this.Data_SplitContainer.Panel2.SuspendLayout();
		this.Data_SplitContainer.SuspendLayout();
		this.Data_Upper_SplitContainer.Panel1.SuspendLayout();
		this.Data_Upper_SplitContainer.Panel2.SuspendLayout();
		this.Data_Upper_SplitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.tableDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.sGroupBindingSource2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.deviceBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.tableBindingNavigator).BeginInit();
		this.tableBindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.reportDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.logBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.reportBindingNavigator).BeginInit();
		this.reportBindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.reportItemDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.logTypeBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.logItemBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.reportItemBindingNavigator).BeginInit();
		this.reportItemBindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pluBindingSource).BeginInit();
		this.Analysis_SplitContainer.Panel1.SuspendLayout();
		this.Analysis_SplitContainer.Panel2.SuspendLayout();
		this.Analysis_SplitContainer.SuspendLayout();
		this.Analysis_Left_TabControl.SuspendLayout();
		this.Filter_TabPage.SuspendLayout();
		this.splitContainer1.Panel1.SuspendLayout();
		this.splitContainer1.Panel2.SuspendLayout();
		this.splitContainer1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.exprDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.exprBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.exprBindingNavigator).BeginInit();
		this.exprBindingNavigator.SuspendLayout();
		this.groupBox1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.op1_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.op2_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.report_ColBindingSource2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.sGroupBindingSource1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.deviceBindingSource1).BeginInit();
		this.Analysis_ImExport_TabPage.SuspendLayout();
		this.splitContainer3.Panel1.SuspendLayout();
		this.splitContainer3.Panel2.SuspendLayout();
		this.splitContainer3.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.excelDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.report_ColBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.excelBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.excelBindingNavigator).BeginInit();
		this.excelBindingNavigator.SuspendLayout();
		this.Analysis_Right_TabControl.SuspendLayout();
		this.List_TabPage.SuspendLayout();
		this.splitContainer5.Panel1.SuspendLayout();
		this.splitContainer5.Panel2.SuspendLayout();
		this.splitContainer5.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.dataGridView1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.resultlogBindingNavigator).BeginInit();
		this.resultlogBindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.resultDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.logType2BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.resultBindingNavigator).BeginInit();
		this.resultBindingNavigator.SuspendLayout();
		this.Report_TabPage.SuspendLayout();
		this.splitContainer2.Panel1.SuspendLayout();
		this.splitContainer2.Panel2.SuspendLayout();
		this.splitContainer2.SuspendLayout();
		this.splitContainer4.Panel1.SuspendLayout();
		this.splitContainer4.Panel2.SuspendLayout();
		this.splitContainer4.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.sGroupDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.sGroupBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.sGroupBindingNavigator).BeginInit();
		this.sGroupBindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.stockItemDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.stockTypeBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.stockItemBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.stockItemBindingNavigator).BeginInit();
		this.stockItemBindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.stockDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.stockBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.stockBindingNavigator).BeginInit();
		this.stockBindingNavigator.SuspendLayout();
		this.Main_TabControl.SuspendLayout();
		this.Sale_TabPage.SuspendLayout();
		this.Sale_TabControl.SuspendLayout();
		this.Data_TabPage.SuspendLayout();
		this.DataImport_TabPage.SuspendLayout();
		this.Analysis_TabPage.SuspendLayout();
		this.Stock_TabPage.SuspendLayout();
		this.MF_SplitContainer.Panel1.SuspendLayout();
		this.MF_SplitContainer.Panel2.SuspendLayout();
		this.MF_SplitContainer.SuspendLayout();
		this.shrink_ToolStrip.SuspendLayout();
		this.MF_D_SplitContainer.Panel1.SuspendLayout();
		this.MF_D_SplitContainer.Panel2.SuspendLayout();
		this.MF_D_SplitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.allLog_DataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.allLogsbindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.MFD_L_BindingNavigator).BeginInit();
		this.MFD_L_BindingNavigator.SuspendLayout();
		this.MFD_L_ToolStrip.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.allStock_DataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.allStockbindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.MFD_R_BindingNavigator).BeginInit();
		this.MFD_R_BindingNavigator.SuspendLayout();
		this.MFD_R_ToolStrip.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.bindingSource1).BeginInit();
		base.SuspendLayout();
		resources.ApplyResources(this.splitContainer6, "splitContainer6");
		this.splitContainer6.Name = "splitContainer6";
		this.splitContainer6.Panel1.Controls.Add(this.listView);
		resources.ApplyResources(this.splitContainer6.Panel2, "splitContainer6.Panel2");
		this.splitContainer6.Panel2.Controls.Add(this.importRS232_GroupBox);
		this.splitContainer6.Panel2.Controls.Add(this.ReportInfo_TextBox);
		this.splitContainer6.Panel2.Controls.Add(this.ReportError_TextBox);
		this.splitContainer6.Panel2.Controls.Add(this.importFile_GroupBox);
		this.splitContainer6.SizeChanged += new System.EventHandler(splitContainer6_SizeChanged);
		this.listView.CheckBoxes = true;
		this.listView.Columns.AddRange(new System.Windows.Forms.ColumnHeader[8] { this.fileNameColumnHeader, this.macColumnHeader, this.stockColumnHeader, this.shopNameColumnHeader, this.machineNameColumnHeader, this.machineNumberColumnHeader, this.timeColumnHeader, this.pathColumnHeader });
		resources.ApplyResources(this.listView, "listView");
		this.listView.FullRowSelect = true;
		this.listView.HideSelection = false;
		this.listView.MultiSelect = false;
		this.listView.Name = "listView";
		this.listView.UseCompatibleStateImageBehavior = false;
		this.listView.View = System.Windows.Forms.View.Details;
		this.listView.ItemCheck += new System.Windows.Forms.ItemCheckEventHandler(listView_ItemCheck);
		this.listView.ItemChecked += new System.Windows.Forms.ItemCheckedEventHandler(listView_ItemChecked);
		this.listView.SelectedIndexChanged += new System.EventHandler(listView_SelectedIndexChanged);
		this.listView.KeyDown += new System.Windows.Forms.KeyEventHandler(listView_KeyDown);
		resources.ApplyResources(this.fileNameColumnHeader, "fileNameColumnHeader");
		resources.ApplyResources(this.macColumnHeader, "macColumnHeader");
		resources.ApplyResources(this.stockColumnHeader, "stockColumnHeader");
		resources.ApplyResources(this.shopNameColumnHeader, "shopNameColumnHeader");
		resources.ApplyResources(this.machineNameColumnHeader, "machineNameColumnHeader");
		resources.ApplyResources(this.machineNumberColumnHeader, "machineNumberColumnHeader");
		resources.ApplyResources(this.timeColumnHeader, "timeColumnHeader");
		resources.ApplyResources(this.pathColumnHeader, "pathColumnHeader");
		this.importRS232_GroupBox.Controls.Add(this.serialComboBox);
		this.importRS232_GroupBox.Controls.Add(this.baudComboBox);
		this.importRS232_GroupBox.Controls.Add(this.openButton);
		this.importRS232_GroupBox.Controls.Add(this.reCheckBox);
		resources.ApplyResources(this.importRS232_GroupBox, "importRS232_GroupBox");
		this.importRS232_GroupBox.Name = "importRS232_GroupBox";
		this.importRS232_GroupBox.TabStop = false;
		this.serialComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.serialComboBox, "serialComboBox");
		this.serialComboBox.Name = "serialComboBox";
		this.baudComboBox.FormattingEnabled = true;
		this.baudComboBox.Items.AddRange(new object[14]
		{
			resources.GetString("baudComboBox.Items"),
			resources.GetString("baudComboBox.Items1"),
			resources.GetString("baudComboBox.Items2"),
			resources.GetString("baudComboBox.Items3"),
			resources.GetString("baudComboBox.Items4"),
			resources.GetString("baudComboBox.Items5"),
			resources.GetString("baudComboBox.Items6"),
			resources.GetString("baudComboBox.Items7"),
			resources.GetString("baudComboBox.Items8"),
			resources.GetString("baudComboBox.Items9"),
			resources.GetString("baudComboBox.Items10"),
			resources.GetString("baudComboBox.Items11"),
			resources.GetString("baudComboBox.Items12"),
			resources.GetString("baudComboBox.Items13")
		});
		resources.ApplyResources(this.baudComboBox, "baudComboBox");
		this.baudComboBox.Name = "baudComboBox";
		resources.ApplyResources(this.openButton, "openButton");
		this.openButton.Name = "openButton";
		this.openButton.UseVisualStyleBackColor = true;
		this.openButton.Click += new System.EventHandler(openButton_Click);
		resources.ApplyResources(this.reCheckBox, "reCheckBox");
		this.reCheckBox.Name = "reCheckBox";
		this.reCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.ReportInfo_TextBox, "ReportInfo_TextBox");
		this.ReportInfo_TextBox.Name = "ReportInfo_TextBox";
		this.ReportInfo_TextBox.ReadOnly = true;
		resources.ApplyResources(this.ReportError_TextBox, "ReportError_TextBox");
		this.ReportError_TextBox.Name = "ReportError_TextBox";
		this.ReportError_TextBox.ReadOnly = true;
		this.importFile_GroupBox.Controls.Add(this.progressBar);
		this.importFile_GroupBox.Controls.Add(this.importButton);
		this.importFile_GroupBox.Controls.Add(this.allDefaultStock_Button);
		this.importFile_GroupBox.Controls.Add(this.folderButton);
		this.importFile_GroupBox.Controls.Add(this.specifyStock_Button);
		this.importFile_GroupBox.Controls.Add(this.clearButton);
		this.importFile_GroupBox.Controls.Add(this.fileButton);
		this.importFile_GroupBox.Controls.Add(this.allCheckBox);
		this.importFile_GroupBox.Controls.Add(this.subdirCheckBox);
		resources.ApplyResources(this.importFile_GroupBox, "importFile_GroupBox");
		this.importFile_GroupBox.Name = "importFile_GroupBox";
		this.importFile_GroupBox.TabStop = false;
		resources.ApplyResources(this.progressBar, "progressBar");
		this.progressBar.Name = "progressBar";
		this.progressBar.Step = 1;
		resources.ApplyResources(this.importButton, "importButton");
		this.importButton.Name = "importButton";
		this.importButton.UseVisualStyleBackColor = true;
		this.importButton.Click += new System.EventHandler(importButton_Click);
		resources.ApplyResources(this.allDefaultStock_Button, "allDefaultStock_Button");
		this.allDefaultStock_Button.Name = "allDefaultStock_Button";
		this.allDefaultStock_Button.UseVisualStyleBackColor = true;
		this.allDefaultStock_Button.Click += new System.EventHandler(allDefaultStock_Button_Click);
		resources.ApplyResources(this.folderButton, "folderButton");
		this.folderButton.Name = "folderButton";
		this.folderButton.UseVisualStyleBackColor = true;
		this.folderButton.Click += new System.EventHandler(folderButton_Click);
		resources.ApplyResources(this.specifyStock_Button, "specifyStock_Button");
		this.specifyStock_Button.Name = "specifyStock_Button";
		this.specifyStock_Button.UseVisualStyleBackColor = true;
		this.specifyStock_Button.Click += new System.EventHandler(existStock_Button_Click);
		resources.ApplyResources(this.clearButton, "clearButton");
		this.clearButton.Name = "clearButton";
		this.clearButton.UseVisualStyleBackColor = true;
		this.clearButton.Click += new System.EventHandler(clearButton_Click);
		resources.ApplyResources(this.fileButton, "fileButton");
		this.fileButton.Name = "fileButton";
		this.fileButton.UseVisualStyleBackColor = true;
		this.fileButton.Click += new System.EventHandler(fileButton_Click);
		resources.ApplyResources(this.allCheckBox, "allCheckBox");
		this.allCheckBox.Name = "allCheckBox";
		this.allCheckBox.UseVisualStyleBackColor = true;
		this.allCheckBox.CheckedChanged += new System.EventHandler(allCheckBox_CheckedChanged);
		resources.ApplyResources(this.subdirCheckBox, "subdirCheckBox");
		this.subdirCheckBox.Checked = true;
		this.subdirCheckBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.subdirCheckBox.Name = "subdirCheckBox";
		this.subdirCheckBox.UseVisualStyleBackColor = true;
		this.resultLogItemBindingSource.DataMember = "ResultLogItem";
		this.resultLogItemBindingSource.DataSource = this.reportDataSet;
		this.reportDataSet.DataSetName = "ReportDataSet";
		this.reportDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.resultLogBindingSource.DataMember = "ResultLog";
		this.resultLogBindingSource.DataSource = this.reportDataSet;
		resources.ApplyResources(this.Data_SplitContainer, "Data_SplitContainer");
		this.Data_SplitContainer.Name = "Data_SplitContainer";
		this.Data_SplitContainer.Panel1.Controls.Add(this.Data_Upper_SplitContainer);
		this.Data_SplitContainer.Panel2.Controls.Add(this.reportItemDataGridView);
		this.Data_SplitContainer.Panel2.Controls.Add(this.reportItemBindingNavigator);
		resources.ApplyResources(this.Data_Upper_SplitContainer, "Data_Upper_SplitContainer");
		this.Data_Upper_SplitContainer.Name = "Data_Upper_SplitContainer";
		this.Data_Upper_SplitContainer.Panel1.Controls.Add(this.tableDataGridView);
		this.Data_Upper_SplitContainer.Panel1.Controls.Add(this.tableBindingNavigator);
		this.Data_Upper_SplitContainer.Panel2.Controls.Add(this.reportDataGridView);
		this.Data_Upper_SplitContainer.Panel2.Controls.Add(this.reportBindingNavigator);
		this.tableDataGridView.AllowUserToAddRows = false;
		this.tableDataGridView.AllowUserToDeleteRows = false;
		this.tableDataGridView.AutoGenerateColumns = false;
		this.tableDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.tableDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.tableDataGridView, "tableDataGridView");
		this.tableDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.tableDataGridView.Columns.AddRange(this.mACDataGridViewTextBoxColumn1, this.nameDataGridViewTextBoxColumn1, this.gIDDataGridViewComboBoxColumn1);
		this.tableDataGridView.DataSource = this.deviceBindingSource;
		this.tableDataGridView.EditMode = System.Windows.Forms.DataGridViewEditMode.EditProgrammatically;
		this.tableDataGridView.Name = "tableDataGridView";
		this.tableDataGridView.RowTemplate.Height = 23;
		this.tableDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.tableDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(tableDataGridView_DataError);
		this.mACDataGridViewTextBoxColumn1.DataPropertyName = "MAC";
		resources.ApplyResources(this.mACDataGridViewTextBoxColumn1, "mACDataGridViewTextBoxColumn1");
		this.mACDataGridViewTextBoxColumn1.Name = "mACDataGridViewTextBoxColumn1";
		this.nameDataGridViewTextBoxColumn1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.nameDataGridViewTextBoxColumn1.DataPropertyName = "Name";
		this.nameDataGridViewTextBoxColumn1.FillWeight = 75f;
		resources.ApplyResources(this.nameDataGridViewTextBoxColumn1, "nameDataGridViewTextBoxColumn1");
		this.nameDataGridViewTextBoxColumn1.Name = "nameDataGridViewTextBoxColumn1";
		this.gIDDataGridViewComboBoxColumn1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.gIDDataGridViewComboBoxColumn1.DataPropertyName = "GID";
		this.gIDDataGridViewComboBoxColumn1.DataSource = this.sGroupBindingSource2;
		this.gIDDataGridViewComboBoxColumn1.DisplayMember = "Name";
		this.gIDDataGridViewComboBoxColumn1.FillWeight = 75f;
		resources.ApplyResources(this.gIDDataGridViewComboBoxColumn1, "gIDDataGridViewComboBoxColumn1");
		this.gIDDataGridViewComboBoxColumn1.Name = "gIDDataGridViewComboBoxColumn1";
		this.gIDDataGridViewComboBoxColumn1.ValueMember = "GID";
		this.sGroupBindingSource2.DataMember = "SGroup";
		this.sGroupBindingSource2.DataSource = this.reportDataSet;
		this.deviceBindingSource.DataMember = "Device";
		this.deviceBindingSource.DataSource = this.reportDataSet;
		this.deviceBindingSource.Sort = "MAC";
		this.deviceBindingSource.CurrentChanged += new System.EventHandler(deviceBindingSource_CurrentChanged);
		this.tableBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem8;
		this.tableBindingNavigator.BindingSource = this.deviceBindingSource;
		this.tableBindingNavigator.CountItem = this.bindingNavigatorCountItem8;
		this.tableBindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem8;
		this.tableBindingNavigator.GripStyle = System.Windows.Forms.ToolStripGripStyle.Hidden;
		this.tableBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[12]
		{
			this.bindingNavigatorMoveFirstItem8, this.bindingNavigatorMovePreviousItem8, this.bindingNavigatorSeparator24, this.bindingNavigatorPositionItem8, this.bindingNavigatorCountItem8, this.bindingNavigatorSeparator25, this.bindingNavigatorMoveNextItem8, this.bindingNavigatorMoveLastItem8, this.bindingNavigatorSeparator26, this.bindingNavigatorAddNewItem8,
			this.bindingNavigatorDeleteItem8, this.editTolStripButton
		});
		resources.ApplyResources(this.tableBindingNavigator, "tableBindingNavigator");
		this.tableBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem8;
		this.tableBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem8;
		this.tableBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem8;
		this.tableBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem8;
		this.tableBindingNavigator.Name = "tableBindingNavigator";
		this.tableBindingNavigator.PositionItem = this.bindingNavigatorPositionItem8;
		this.bindingNavigatorAddNewItem8.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem8, "bindingNavigatorAddNewItem8");
		this.bindingNavigatorAddNewItem8.Name = "bindingNavigatorAddNewItem8";
		this.bindingNavigatorCountItem8.Name = "bindingNavigatorCountItem8";
		resources.ApplyResources(this.bindingNavigatorCountItem8, "bindingNavigatorCountItem8");
		this.bindingNavigatorDeleteItem8.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem8, "bindingNavigatorDeleteItem8");
		this.bindingNavigatorDeleteItem8.Name = "bindingNavigatorDeleteItem8";
		this.bindingNavigatorMoveFirstItem8.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem8, "bindingNavigatorMoveFirstItem8");
		this.bindingNavigatorMoveFirstItem8.Name = "bindingNavigatorMoveFirstItem8";
		this.bindingNavigatorMovePreviousItem8.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem8, "bindingNavigatorMovePreviousItem8");
		this.bindingNavigatorMovePreviousItem8.Name = "bindingNavigatorMovePreviousItem8";
		this.bindingNavigatorSeparator24.Name = "bindingNavigatorSeparator24";
		resources.ApplyResources(this.bindingNavigatorSeparator24, "bindingNavigatorSeparator24");
		resources.ApplyResources(this.bindingNavigatorPositionItem8, "bindingNavigatorPositionItem8");
		this.bindingNavigatorPositionItem8.Name = "bindingNavigatorPositionItem8";
		this.bindingNavigatorSeparator25.Name = "bindingNavigatorSeparator25";
		resources.ApplyResources(this.bindingNavigatorSeparator25, "bindingNavigatorSeparator25");
		this.bindingNavigatorMoveNextItem8.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem8, "bindingNavigatorMoveNextItem8");
		this.bindingNavigatorMoveNextItem8.Name = "bindingNavigatorMoveNextItem8";
		this.bindingNavigatorMoveLastItem8.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem8, "bindingNavigatorMoveLastItem8");
		this.bindingNavigatorMoveLastItem8.Name = "bindingNavigatorMoveLastItem8";
		this.bindingNavigatorSeparator26.Name = "bindingNavigatorSeparator26";
		resources.ApplyResources(this.bindingNavigatorSeparator26, "bindingNavigatorSeparator26");
		this.editTolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.editTolStripButton.Image = ECS.Properties.Resources.Edit;
		resources.ApplyResources(this.editTolStripButton, "editTolStripButton");
		this.editTolStripButton.Name = "editTolStripButton";
		this.editTolStripButton.Click += new System.EventHandler(editTolStripButton_Click);
		this.reportDataGridView.AllowUserToAddRows = false;
		this.reportDataGridView.AllowUserToDeleteRows = false;
		this.reportDataGridView.AutoGenerateColumns = false;
		this.reportDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.reportDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.reportDataGridView, "reportDataGridView");
		this.reportDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.reportDataGridView.Columns.AddRange(this.mACDataGridViewTextBoxColumn4, this.fIDDataGridViewTextBoxColumn1, this.dateTimeDataGridViewTextBoxColumn1, this.sIDDataGridViewTextBoxColumn1, this.subNoDataGridViewTextBoxColumn1, this.paymentTotalDataGridViewTextBoxColumn1, this.taxDataGridViewTextBoxColumn2, this.costDataGridViewTextBoxColumn2, this.salesmanDataGridViewTextBoxColumn1, this.disRoundDataGridViewTextBoxColumn1, this.epay0DataGridViewTextBoxColumn1, this.epay1DataGridViewTextBoxColumn1, this.epay2DataGridViewTextBoxColumn1, this.epay3DataGridViewTextBoxColumn1, this.epay4DataGridViewTextBoxColumn1, this.epay5DataGridViewTextBoxColumn1, this.epay6DataGridViewTextBoxColumn1, this.epay7DataGridViewTextBoxColumn1, this.paymentCardDataGridViewTextBoxColumn1, this.paymentOther1DataGridViewTextBoxColumn1, this.paymentOther2DataGridViewTextBoxColumn1, this.paymentOther3DataGridViewTextBoxColumn1, this.sfeeDataGridViewTextBoxColumn1);
		this.reportDataGridView.DataSource = this.logBindingSource;
		this.reportDataGridView.Name = "reportDataGridView";
		this.reportDataGridView.ReadOnly = true;
		this.reportDataGridView.RowTemplate.Height = 23;
		this.reportDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(reportDataGridView_DataError);
		this.mACDataGridViewTextBoxColumn4.DataPropertyName = "MAC";
		resources.ApplyResources(this.mACDataGridViewTextBoxColumn4, "mACDataGridViewTextBoxColumn4");
		this.mACDataGridViewTextBoxColumn4.Name = "mACDataGridViewTextBoxColumn4";
		this.mACDataGridViewTextBoxColumn4.ReadOnly = true;
		this.fIDDataGridViewTextBoxColumn1.DataPropertyName = "FID";
		resources.ApplyResources(this.fIDDataGridViewTextBoxColumn1, "fIDDataGridViewTextBoxColumn1");
		this.fIDDataGridViewTextBoxColumn1.Name = "fIDDataGridViewTextBoxColumn1";
		this.fIDDataGridViewTextBoxColumn1.ReadOnly = true;
		this.dateTimeDataGridViewTextBoxColumn1.DataPropertyName = "DateTime";
		resources.ApplyResources(this.dateTimeDataGridViewTextBoxColumn1, "dateTimeDataGridViewTextBoxColumn1");
		this.dateTimeDataGridViewTextBoxColumn1.Name = "dateTimeDataGridViewTextBoxColumn1";
		this.dateTimeDataGridViewTextBoxColumn1.ReadOnly = true;
		this.sIDDataGridViewTextBoxColumn1.DataPropertyName = "SID";
		resources.ApplyResources(this.sIDDataGridViewTextBoxColumn1, "sIDDataGridViewTextBoxColumn1");
		this.sIDDataGridViewTextBoxColumn1.Name = "sIDDataGridViewTextBoxColumn1";
		this.sIDDataGridViewTextBoxColumn1.ReadOnly = true;
		this.subNoDataGridViewTextBoxColumn1.DataPropertyName = "SubNo";
		resources.ApplyResources(this.subNoDataGridViewTextBoxColumn1, "subNoDataGridViewTextBoxColumn1");
		this.subNoDataGridViewTextBoxColumn1.Name = "subNoDataGridViewTextBoxColumn1";
		this.subNoDataGridViewTextBoxColumn1.ReadOnly = true;
		this.paymentTotalDataGridViewTextBoxColumn1.DataPropertyName = "Payment_Total";
		resources.ApplyResources(this.paymentTotalDataGridViewTextBoxColumn1, "paymentTotalDataGridViewTextBoxColumn1");
		this.paymentTotalDataGridViewTextBoxColumn1.Name = "paymentTotalDataGridViewTextBoxColumn1";
		this.paymentTotalDataGridViewTextBoxColumn1.ReadOnly = true;
		this.taxDataGridViewTextBoxColumn2.DataPropertyName = "Tax";
		resources.ApplyResources(this.taxDataGridViewTextBoxColumn2, "taxDataGridViewTextBoxColumn2");
		this.taxDataGridViewTextBoxColumn2.Name = "taxDataGridViewTextBoxColumn2";
		this.taxDataGridViewTextBoxColumn2.ReadOnly = true;
		this.costDataGridViewTextBoxColumn2.DataPropertyName = "Cost";
		resources.ApplyResources(this.costDataGridViewTextBoxColumn2, "costDataGridViewTextBoxColumn2");
		this.costDataGridViewTextBoxColumn2.Name = "costDataGridViewTextBoxColumn2";
		this.costDataGridViewTextBoxColumn2.ReadOnly = true;
		this.salesmanDataGridViewTextBoxColumn1.DataPropertyName = "Salesman";
		resources.ApplyResources(this.salesmanDataGridViewTextBoxColumn1, "salesmanDataGridViewTextBoxColumn1");
		this.salesmanDataGridViewTextBoxColumn1.Name = "salesmanDataGridViewTextBoxColumn1";
		this.salesmanDataGridViewTextBoxColumn1.ReadOnly = true;
		this.disRoundDataGridViewTextBoxColumn1.DataPropertyName = "DisRound";
		resources.ApplyResources(this.disRoundDataGridViewTextBoxColumn1, "disRoundDataGridViewTextBoxColumn1");
		this.disRoundDataGridViewTextBoxColumn1.Name = "disRoundDataGridViewTextBoxColumn1";
		this.disRoundDataGridViewTextBoxColumn1.ReadOnly = true;
		this.epay0DataGridViewTextBoxColumn1.DataPropertyName = "Alipay";
		resources.ApplyResources(this.epay0DataGridViewTextBoxColumn1, "epay0DataGridViewTextBoxColumn1");
		this.epay0DataGridViewTextBoxColumn1.Name = "epay0DataGridViewTextBoxColumn1";
		this.epay0DataGridViewTextBoxColumn1.ReadOnly = true;
		this.epay1DataGridViewTextBoxColumn1.DataPropertyName = "WXpay";
		resources.ApplyResources(this.epay1DataGridViewTextBoxColumn1, "epay1DataGridViewTextBoxColumn1");
		this.epay1DataGridViewTextBoxColumn1.Name = "epay1DataGridViewTextBoxColumn1";
		this.epay1DataGridViewTextBoxColumn1.ReadOnly = true;
		this.epay2DataGridViewTextBoxColumn1.DataPropertyName = "Epay2";
		resources.ApplyResources(this.epay2DataGridViewTextBoxColumn1, "epay2DataGridViewTextBoxColumn1");
		this.epay2DataGridViewTextBoxColumn1.Name = "epay2DataGridViewTextBoxColumn1";
		this.epay2DataGridViewTextBoxColumn1.ReadOnly = true;
		this.epay3DataGridViewTextBoxColumn1.DataPropertyName = "Epay3";
		resources.ApplyResources(this.epay3DataGridViewTextBoxColumn1, "epay3DataGridViewTextBoxColumn1");
		this.epay3DataGridViewTextBoxColumn1.Name = "epay3DataGridViewTextBoxColumn1";
		this.epay3DataGridViewTextBoxColumn1.ReadOnly = true;
		this.epay4DataGridViewTextBoxColumn1.DataPropertyName = "Epay4";
		resources.ApplyResources(this.epay4DataGridViewTextBoxColumn1, "epay4DataGridViewTextBoxColumn1");
		this.epay4DataGridViewTextBoxColumn1.Name = "epay4DataGridViewTextBoxColumn1";
		this.epay4DataGridViewTextBoxColumn1.ReadOnly = true;
		this.epay5DataGridViewTextBoxColumn1.DataPropertyName = "Epay5";
		resources.ApplyResources(this.epay5DataGridViewTextBoxColumn1, "epay5DataGridViewTextBoxColumn1");
		this.epay5DataGridViewTextBoxColumn1.Name = "epay5DataGridViewTextBoxColumn1";
		this.epay5DataGridViewTextBoxColumn1.ReadOnly = true;
		this.epay6DataGridViewTextBoxColumn1.DataPropertyName = "Epay6";
		resources.ApplyResources(this.epay6DataGridViewTextBoxColumn1, "epay6DataGridViewTextBoxColumn1");
		this.epay6DataGridViewTextBoxColumn1.Name = "epay6DataGridViewTextBoxColumn1";
		this.epay6DataGridViewTextBoxColumn1.ReadOnly = true;
		this.epay7DataGridViewTextBoxColumn1.DataPropertyName = "Epay7";
		resources.ApplyResources(this.epay7DataGridViewTextBoxColumn1, "epay7DataGridViewTextBoxColumn1");
		this.epay7DataGridViewTextBoxColumn1.Name = "epay7DataGridViewTextBoxColumn1";
		this.epay7DataGridViewTextBoxColumn1.ReadOnly = true;
		this.paymentCardDataGridViewTextBoxColumn1.DataPropertyName = "Payment_Card";
		resources.ApplyResources(this.paymentCardDataGridViewTextBoxColumn1, "paymentCardDataGridViewTextBoxColumn1");
		this.paymentCardDataGridViewTextBoxColumn1.Name = "paymentCardDataGridViewTextBoxColumn1";
		this.paymentCardDataGridViewTextBoxColumn1.ReadOnly = true;
		this.paymentOther1DataGridViewTextBoxColumn1.DataPropertyName = "Payment_Other_1";
		resources.ApplyResources(this.paymentOther1DataGridViewTextBoxColumn1, "paymentOther1DataGridViewTextBoxColumn1");
		this.paymentOther1DataGridViewTextBoxColumn1.Name = "paymentOther1DataGridViewTextBoxColumn1";
		this.paymentOther1DataGridViewTextBoxColumn1.ReadOnly = true;
		this.paymentOther2DataGridViewTextBoxColumn1.DataPropertyName = "Payment_Other_2";
		resources.ApplyResources(this.paymentOther2DataGridViewTextBoxColumn1, "paymentOther2DataGridViewTextBoxColumn1");
		this.paymentOther2DataGridViewTextBoxColumn1.Name = "paymentOther2DataGridViewTextBoxColumn1";
		this.paymentOther2DataGridViewTextBoxColumn1.ReadOnly = true;
		this.paymentOther3DataGridViewTextBoxColumn1.DataPropertyName = "Payment_Other_3";
		resources.ApplyResources(this.paymentOther3DataGridViewTextBoxColumn1, "paymentOther3DataGridViewTextBoxColumn1");
		this.paymentOther3DataGridViewTextBoxColumn1.Name = "paymentOther3DataGridViewTextBoxColumn1";
		this.paymentOther3DataGridViewTextBoxColumn1.ReadOnly = true;
		this.sfeeDataGridViewTextBoxColumn1.DataPropertyName = "Sfee";
		resources.ApplyResources(this.sfeeDataGridViewTextBoxColumn1, "sfeeDataGridViewTextBoxColumn1");
		this.sfeeDataGridViewTextBoxColumn1.Name = "sfeeDataGridViewTextBoxColumn1";
		this.sfeeDataGridViewTextBoxColumn1.ReadOnly = true;
		this.logBindingSource.DataMember = "FK_Device_Log";
		this.logBindingSource.DataSource = this.deviceBindingSource;
		this.reportBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem7;
		this.reportBindingNavigator.BindingSource = this.logBindingSource;
		this.reportBindingNavigator.CountItem = this.bindingNavigatorCountItem7;
		this.reportBindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem7;
		this.reportBindingNavigator.GripStyle = System.Windows.Forms.ToolStripGripStyle.Hidden;
		this.reportBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.bindingNavigatorMoveFirstItem7, this.bindingNavigatorMovePreviousItem7, this.bindingNavigatorSeparator21, this.bindingNavigatorPositionItem7, this.bindingNavigatorCountItem7, this.bindingNavigatorSeparator22, this.bindingNavigatorMoveNextItem7, this.bindingNavigatorMoveLastItem7, this.bindingNavigatorSeparator23, this.bindingNavigatorAddNewItem7,
			this.bindingNavigatorDeleteItem7
		});
		resources.ApplyResources(this.reportBindingNavigator, "reportBindingNavigator");
		this.reportBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem7;
		this.reportBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem7;
		this.reportBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem7;
		this.reportBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem7;
		this.reportBindingNavigator.Name = "reportBindingNavigator";
		this.reportBindingNavigator.PositionItem = this.bindingNavigatorPositionItem7;
		this.bindingNavigatorAddNewItem7.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem7, "bindingNavigatorAddNewItem7");
		this.bindingNavigatorAddNewItem7.Name = "bindingNavigatorAddNewItem7";
		this.bindingNavigatorCountItem7.Name = "bindingNavigatorCountItem7";
		resources.ApplyResources(this.bindingNavigatorCountItem7, "bindingNavigatorCountItem7");
		this.bindingNavigatorDeleteItem7.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem7, "bindingNavigatorDeleteItem7");
		this.bindingNavigatorDeleteItem7.Name = "bindingNavigatorDeleteItem7";
		this.bindingNavigatorMoveFirstItem7.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem7, "bindingNavigatorMoveFirstItem7");
		this.bindingNavigatorMoveFirstItem7.Name = "bindingNavigatorMoveFirstItem7";
		this.bindingNavigatorMovePreviousItem7.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem7, "bindingNavigatorMovePreviousItem7");
		this.bindingNavigatorMovePreviousItem7.Name = "bindingNavigatorMovePreviousItem7";
		this.bindingNavigatorSeparator21.Name = "bindingNavigatorSeparator21";
		resources.ApplyResources(this.bindingNavigatorSeparator21, "bindingNavigatorSeparator21");
		resources.ApplyResources(this.bindingNavigatorPositionItem7, "bindingNavigatorPositionItem7");
		this.bindingNavigatorPositionItem7.Name = "bindingNavigatorPositionItem7";
		this.bindingNavigatorSeparator22.Name = "bindingNavigatorSeparator22";
		resources.ApplyResources(this.bindingNavigatorSeparator22, "bindingNavigatorSeparator22");
		this.bindingNavigatorMoveNextItem7.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem7, "bindingNavigatorMoveNextItem7");
		this.bindingNavigatorMoveNextItem7.Name = "bindingNavigatorMoveNextItem7";
		this.bindingNavigatorMoveLastItem7.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem7, "bindingNavigatorMoveLastItem7");
		this.bindingNavigatorMoveLastItem7.Name = "bindingNavigatorMoveLastItem7";
		this.bindingNavigatorSeparator23.Name = "bindingNavigatorSeparator23";
		resources.ApplyResources(this.bindingNavigatorSeparator23, "bindingNavigatorSeparator23");
		this.reportItemDataGridView.AllowUserToAddRows = false;
		this.reportItemDataGridView.AllowUserToDeleteRows = false;
		this.reportItemDataGridView.AutoGenerateColumns = false;
		this.reportItemDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.reportItemDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.reportItemDataGridView, "reportItemDataGridView");
		this.reportItemDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.reportItemDataGridView.Columns.AddRange(this.subIDDataGridViewTextBoxColumn1, this.typeDataGridViewComboBoxColumn1, this.pLUDataGridViewTextBoxColumn1, this.pLUDataGridViewComboBoxColumn1, this.unitDataGridViewTextBoxColumn1, this.unitDataGridViewComboBoxColumn1, this.amountDataGridViewTextBoxColumn1, this.unitPriceDataGridViewTextBoxColumn1, this.priceDataGridViewTextBoxColumn1, this.taxDataGridViewTextBoxColumn1, this.costDataGridViewTextBoxColumn1, this.classDataGridViewTextBoxColumn1, this.deptDataGridViewTextBoxColumn1, this.text1Column1, this.text2Column1, this.text3Column1, this.text4Column1, this.coFIDDataGridViewTextBoxColumn1);
		this.reportItemDataGridView.DataSource = this.logItemBindingSource;
		this.reportItemDataGridView.Name = "reportItemDataGridView";
		this.reportItemDataGridView.ReadOnly = true;
		this.reportItemDataGridView.RowTemplate.Height = 23;
		this.reportItemDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(reportItemDataGridView_DataError);
		this.subIDDataGridViewTextBoxColumn1.DataPropertyName = "SubID";
		resources.ApplyResources(this.subIDDataGridViewTextBoxColumn1, "subIDDataGridViewTextBoxColumn1");
		this.subIDDataGridViewTextBoxColumn1.Name = "subIDDataGridViewTextBoxColumn1";
		this.subIDDataGridViewTextBoxColumn1.ReadOnly = true;
		this.typeDataGridViewComboBoxColumn1.DataPropertyName = "Type";
		this.typeDataGridViewComboBoxColumn1.DataSource = this.logTypeBindingSource;
		this.typeDataGridViewComboBoxColumn1.DisplayMember = "Name";
		resources.ApplyResources(this.typeDataGridViewComboBoxColumn1, "typeDataGridViewComboBoxColumn1");
		this.typeDataGridViewComboBoxColumn1.Name = "typeDataGridViewComboBoxColumn1";
		this.typeDataGridViewComboBoxColumn1.ReadOnly = true;
		this.typeDataGridViewComboBoxColumn1.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.typeDataGridViewComboBoxColumn1.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.typeDataGridViewComboBoxColumn1.ValueMember = "TypeID";
		this.logTypeBindingSource.AllowNew = false;
		this.logTypeBindingSource.DataMember = "rLogsType";
		this.logTypeBindingSource.DataSource = this.reportDataSet;
		this.pLUDataGridViewTextBoxColumn1.DataPropertyName = "PLU";
		resources.ApplyResources(this.pLUDataGridViewTextBoxColumn1, "pLUDataGridViewTextBoxColumn1");
		this.pLUDataGridViewTextBoxColumn1.Name = "pLUDataGridViewTextBoxColumn1";
		this.pLUDataGridViewTextBoxColumn1.ReadOnly = true;
		this.pLUDataGridViewComboBoxColumn1.DataPropertyName = "PLUName";
		resources.ApplyResources(this.pLUDataGridViewComboBoxColumn1, "pLUDataGridViewComboBoxColumn1");
		this.pLUDataGridViewComboBoxColumn1.Name = "pLUDataGridViewComboBoxColumn1";
		this.pLUDataGridViewComboBoxColumn1.ReadOnly = true;
		this.pLUDataGridViewComboBoxColumn1.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.unitDataGridViewTextBoxColumn1.DataPropertyName = "Unit";
		resources.ApplyResources(this.unitDataGridViewTextBoxColumn1, "unitDataGridViewTextBoxColumn1");
		this.unitDataGridViewTextBoxColumn1.Name = "unitDataGridViewTextBoxColumn1";
		this.unitDataGridViewTextBoxColumn1.ReadOnly = true;
		this.unitDataGridViewComboBoxColumn1.DataPropertyName = "Unit";
		this.unitDataGridViewComboBoxColumn1.DataSource = this.unitBindingSource;
		this.unitDataGridViewComboBoxColumn1.DisplayMember = "Pamount";
		resources.ApplyResources(this.unitDataGridViewComboBoxColumn1, "unitDataGridViewComboBoxColumn1");
		this.unitDataGridViewComboBoxColumn1.Name = "unitDataGridViewComboBoxColumn1";
		this.unitDataGridViewComboBoxColumn1.ReadOnly = true;
		this.unitDataGridViewComboBoxColumn1.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.unitDataGridViewComboBoxColumn1.ValueMember = "UnitID";
		this.unitBindingSource.DataMember = "Unit";
		this.unitBindingSource.DataSource = this.ecsDataSet;
		this.ecsDataSet.DataSetName = "ECSDataSet";
		this.ecsDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.amountDataGridViewTextBoxColumn1.DataPropertyName = "Amount";
		resources.ApplyResources(this.amountDataGridViewTextBoxColumn1, "amountDataGridViewTextBoxColumn1");
		this.amountDataGridViewTextBoxColumn1.Name = "amountDataGridViewTextBoxColumn1";
		this.amountDataGridViewTextBoxColumn1.ReadOnly = true;
		this.unitPriceDataGridViewTextBoxColumn1.DataPropertyName = "UnitPrice";
		resources.ApplyResources(this.unitPriceDataGridViewTextBoxColumn1, "unitPriceDataGridViewTextBoxColumn1");
		this.unitPriceDataGridViewTextBoxColumn1.Name = "unitPriceDataGridViewTextBoxColumn1";
		this.unitPriceDataGridViewTextBoxColumn1.ReadOnly = true;
		this.priceDataGridViewTextBoxColumn1.DataPropertyName = "Price";
		resources.ApplyResources(this.priceDataGridViewTextBoxColumn1, "priceDataGridViewTextBoxColumn1");
		this.priceDataGridViewTextBoxColumn1.Name = "priceDataGridViewTextBoxColumn1";
		this.priceDataGridViewTextBoxColumn1.ReadOnly = true;
		this.taxDataGridViewTextBoxColumn1.DataPropertyName = "Tax";
		resources.ApplyResources(this.taxDataGridViewTextBoxColumn1, "taxDataGridViewTextBoxColumn1");
		this.taxDataGridViewTextBoxColumn1.Name = "taxDataGridViewTextBoxColumn1";
		this.taxDataGridViewTextBoxColumn1.ReadOnly = true;
		this.costDataGridViewTextBoxColumn1.DataPropertyName = "Cost";
		resources.ApplyResources(this.costDataGridViewTextBoxColumn1, "costDataGridViewTextBoxColumn1");
		this.costDataGridViewTextBoxColumn1.Name = "costDataGridViewTextBoxColumn1";
		this.costDataGridViewTextBoxColumn1.ReadOnly = true;
		this.classDataGridViewTextBoxColumn1.DataPropertyName = "Class";
		resources.ApplyResources(this.classDataGridViewTextBoxColumn1, "classDataGridViewTextBoxColumn1");
		this.classDataGridViewTextBoxColumn1.Name = "classDataGridViewTextBoxColumn1";
		this.classDataGridViewTextBoxColumn1.ReadOnly = true;
		this.deptDataGridViewTextBoxColumn1.DataPropertyName = "Dept";
		resources.ApplyResources(this.deptDataGridViewTextBoxColumn1, "deptDataGridViewTextBoxColumn1");
		this.deptDataGridViewTextBoxColumn1.Name = "deptDataGridViewTextBoxColumn1";
		this.deptDataGridViewTextBoxColumn1.ReadOnly = true;
		this.text1Column1.DataPropertyName = "Text1";
		resources.ApplyResources(this.text1Column1, "text1Column1");
		this.text1Column1.Name = "text1Column1";
		this.text1Column1.ReadOnly = true;
		this.text2Column1.DataPropertyName = "Text2";
		resources.ApplyResources(this.text2Column1, "text2Column1");
		this.text2Column1.Name = "text2Column1";
		this.text2Column1.ReadOnly = true;
		this.text3Column1.DataPropertyName = "Text3";
		resources.ApplyResources(this.text3Column1, "text3Column1");
		this.text3Column1.Name = "text3Column1";
		this.text3Column1.ReadOnly = true;
		this.text4Column1.DataPropertyName = "Text4";
		resources.ApplyResources(this.text4Column1, "text4Column1");
		this.text4Column1.Name = "text4Column1";
		this.text4Column1.ReadOnly = true;
		this.coFIDDataGridViewTextBoxColumn1.DataPropertyName = "CoFID";
		resources.ApplyResources(this.coFIDDataGridViewTextBoxColumn1, "coFIDDataGridViewTextBoxColumn1");
		this.coFIDDataGridViewTextBoxColumn1.Name = "coFIDDataGridViewTextBoxColumn1";
		this.coFIDDataGridViewTextBoxColumn1.ReadOnly = true;
		this.logItemBindingSource.DataMember = "FK_Log_LogItem";
		this.logItemBindingSource.DataSource = this.logBindingSource;
		this.reportItemBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem6;
		this.reportItemBindingNavigator.BindingSource = this.logItemBindingSource;
		this.reportItemBindingNavigator.CountItem = this.bindingNavigatorCountItem6;
		this.reportItemBindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem6;
		this.reportItemBindingNavigator.GripStyle = System.Windows.Forms.ToolStripGripStyle.Hidden;
		this.reportItemBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.bindingNavigatorMoveFirstItem6, this.bindingNavigatorMovePreviousItem6, this.bindingNavigatorSeparator18, this.bindingNavigatorPositionItem6, this.bindingNavigatorCountItem6, this.bindingNavigatorSeparator19, this.bindingNavigatorMoveNextItem6, this.bindingNavigatorMoveLastItem6, this.bindingNavigatorSeparator20, this.bindingNavigatorAddNewItem6,
			this.bindingNavigatorDeleteItem6
		});
		resources.ApplyResources(this.reportItemBindingNavigator, "reportItemBindingNavigator");
		this.reportItemBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem6;
		this.reportItemBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem6;
		this.reportItemBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem6;
		this.reportItemBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem6;
		this.reportItemBindingNavigator.Name = "reportItemBindingNavigator";
		this.reportItemBindingNavigator.PositionItem = this.bindingNavigatorPositionItem6;
		this.bindingNavigatorAddNewItem6.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem6, "bindingNavigatorAddNewItem6");
		this.bindingNavigatorAddNewItem6.Name = "bindingNavigatorAddNewItem6";
		this.bindingNavigatorCountItem6.Name = "bindingNavigatorCountItem6";
		resources.ApplyResources(this.bindingNavigatorCountItem6, "bindingNavigatorCountItem6");
		this.bindingNavigatorDeleteItem6.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem6, "bindingNavigatorDeleteItem6");
		this.bindingNavigatorDeleteItem6.Name = "bindingNavigatorDeleteItem6";
		this.bindingNavigatorMoveFirstItem6.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem6, "bindingNavigatorMoveFirstItem6");
		this.bindingNavigatorMoveFirstItem6.Name = "bindingNavigatorMoveFirstItem6";
		this.bindingNavigatorMovePreviousItem6.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem6, "bindingNavigatorMovePreviousItem6");
		this.bindingNavigatorMovePreviousItem6.Name = "bindingNavigatorMovePreviousItem6";
		this.bindingNavigatorSeparator18.Name = "bindingNavigatorSeparator18";
		resources.ApplyResources(this.bindingNavigatorSeparator18, "bindingNavigatorSeparator18");
		resources.ApplyResources(this.bindingNavigatorPositionItem6, "bindingNavigatorPositionItem6");
		this.bindingNavigatorPositionItem6.Name = "bindingNavigatorPositionItem6";
		this.bindingNavigatorSeparator19.Name = "bindingNavigatorSeparator19";
		resources.ApplyResources(this.bindingNavigatorSeparator19, "bindingNavigatorSeparator19");
		this.bindingNavigatorMoveNextItem6.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem6, "bindingNavigatorMoveNextItem6");
		this.bindingNavigatorMoveNextItem6.Name = "bindingNavigatorMoveNextItem6";
		this.bindingNavigatorMoveLastItem6.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem6, "bindingNavigatorMoveLastItem6");
		this.bindingNavigatorMoveLastItem6.Name = "bindingNavigatorMoveLastItem6";
		this.bindingNavigatorSeparator20.Name = "bindingNavigatorSeparator20";
		resources.ApplyResources(this.bindingNavigatorSeparator20, "bindingNavigatorSeparator20");
		this.pluBindingSource.DataMember = "PLU";
		this.pluBindingSource.DataSource = this.ecsDataSet;
		resources.ApplyResources(this.Analysis_SplitContainer, "Analysis_SplitContainer");
		this.Analysis_SplitContainer.Name = "Analysis_SplitContainer";
		this.Analysis_SplitContainer.Panel1.Controls.Add(this.Analysis_Left_TabControl);
		this.Analysis_SplitContainer.Panel2.Controls.Add(this.Analysis_Right_TabControl);
		this.Analysis_Left_TabControl.Controls.Add(this.Filter_TabPage);
		this.Analysis_Left_TabControl.Controls.Add(this.Analysis_ImExport_TabPage);
		resources.ApplyResources(this.Analysis_Left_TabControl, "Analysis_Left_TabControl");
		this.Analysis_Left_TabControl.Multiline = true;
		this.Analysis_Left_TabControl.Name = "Analysis_Left_TabControl";
		this.Analysis_Left_TabControl.SelectedIndex = 0;
		this.Filter_TabPage.Controls.Add(this.splitContainer1);
		resources.ApplyResources(this.Filter_TabPage, "Filter_TabPage");
		this.Filter_TabPage.Name = "Filter_TabPage";
		this.Filter_TabPage.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.splitContainer1, "splitContainer1");
		this.splitContainer1.Name = "splitContainer1";
		this.splitContainer1.Panel1.Controls.Add(this.exprDataGridView);
		this.splitContainer1.Panel1.Controls.Add(this.exprBindingNavigator);
		this.splitContainer1.Panel2.Controls.Add(this.groupBox1);
		this.splitContainer1.Panel2.Controls.Add(this.filterDoButton);
		this.exprDataGridView.AllowUserToAddRows = false;
		this.exprDataGridView.AutoGenerateColumns = false;
		this.exprDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.exprDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.exprDataGridView, "exprDataGridView");
		this.exprDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.exprDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn2, this.dataGridViewCheckBoxColumn1, this.DisplayColumn, this.dataGridViewTextBoxColumn1);
		this.exprDataGridView.DataSource = this.exprBindingSource;
		this.exprDataGridView.Name = "exprDataGridView";
		this.exprDataGridView.RowTemplate.Height = 23;
		this.exprDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.exprDataGridView.CellDoubleClick += new System.Windows.Forms.DataGridViewCellEventHandler(exprDataGridView_CellDoubleClick);
		this.dataGridViewTextBoxColumn2.DataPropertyName = "AndOr";
		resources.ApplyResources(this.dataGridViewTextBoxColumn2, "dataGridViewTextBoxColumn2");
		this.dataGridViewTextBoxColumn2.Items.AddRange("AND", "  OR");
		this.dataGridViewTextBoxColumn2.Name = "dataGridViewTextBoxColumn2";
		this.dataGridViewTextBoxColumn2.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.dataGridViewCheckBoxColumn1.DataPropertyName = "Not";
		resources.ApplyResources(this.dataGridViewCheckBoxColumn1, "dataGridViewCheckBoxColumn1");
		this.dataGridViewCheckBoxColumn1.Name = "dataGridViewCheckBoxColumn1";
		this.DisplayColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.DisplayColumn.DataPropertyName = "Display";
		resources.ApplyResources(this.DisplayColumn, "DisplayColumn");
		this.DisplayColumn.Name = "DisplayColumn";
		this.DisplayColumn.ReadOnly = true;
		this.DisplayColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
		this.dataGridViewTextBoxColumn1.DataPropertyName = "ID";
		resources.ApplyResources(this.dataGridViewTextBoxColumn1, "dataGridViewTextBoxColumn1");
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.dataGridViewTextBoxColumn1.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
		this.exprBindingSource.DataMember = "Expr";
		this.exprBindingSource.DataSource = this.reportDataSet;
		this.exprBindingSource.CurrentItemChanged += new System.EventHandler(NeedFilter);
		this.exprBindingNavigator.AddNewItem = null;
		this.exprBindingNavigator.BindingSource = this.exprBindingSource;
		this.exprBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.exprBindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem;
		this.exprBindingNavigator.GripStyle = System.Windows.Forms.ToolStripGripStyle.Hidden;
		this.exprBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[13]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem, this.editToolStripButton, this.exprClearToolStripButton
		});
		resources.ApplyResources(this.exprBindingNavigator, "exprBindingNavigator");
		this.exprBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.exprBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.exprBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.exprBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.exprBindingNavigator.Name = "exprBindingNavigator";
		this.exprBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		resources.ApplyResources(this.bindingNavigatorCountItem, "bindingNavigatorCountItem");
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorDeleteItem.Image = ECS.Properties.Resources.bindingNavigatorDeleteItem;
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
		this.bindingNavigatorMoveFirstItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveFirstItem.Image = ECS.Properties.Resources.bindingNavigatorMoveFirstItem;
		this.bindingNavigatorMoveFirstItem.Name = "bindingNavigatorMoveFirstItem";
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem, "bindingNavigatorMoveFirstItem");
		this.bindingNavigatorMovePreviousItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMovePreviousItem.Image = ECS.Properties.Resources.bindingNavigatorMovePreviousItem;
		this.bindingNavigatorMovePreviousItem.Name = "bindingNavigatorMovePreviousItem";
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem, "bindingNavigatorMovePreviousItem");
		this.bindingNavigatorSeparator.Name = "bindingNavigatorSeparator";
		resources.ApplyResources(this.bindingNavigatorSeparator, "bindingNavigatorSeparator");
		resources.ApplyResources(this.bindingNavigatorPositionItem, "bindingNavigatorPositionItem");
		this.bindingNavigatorPositionItem.Name = "bindingNavigatorPositionItem";
		this.bindingNavigatorSeparator1.Name = "bindingNavigatorSeparator1";
		resources.ApplyResources(this.bindingNavigatorSeparator1, "bindingNavigatorSeparator1");
		this.bindingNavigatorMoveNextItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveNextItem.Image = ECS.Properties.Resources.bindingNavigatorMoveNextItem;
		this.bindingNavigatorMoveNextItem.Name = "bindingNavigatorMoveNextItem";
		resources.ApplyResources(this.bindingNavigatorMoveNextItem, "bindingNavigatorMoveNextItem");
		this.bindingNavigatorMoveLastItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveLastItem.Image = ECS.Properties.Resources.bindingNavigatorMoveLastItem;
		this.bindingNavigatorMoveLastItem.Name = "bindingNavigatorMoveLastItem";
		resources.ApplyResources(this.bindingNavigatorMoveLastItem, "bindingNavigatorMoveLastItem");
		this.bindingNavigatorSeparator2.Name = "bindingNavigatorSeparator2";
		resources.ApplyResources(this.bindingNavigatorSeparator2, "bindingNavigatorSeparator2");
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorAddNewItem.Image = ECS.Properties.Resources.bindingNavigatorAddNewItem;
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
		this.bindingNavigatorAddNewItem.Click += new System.EventHandler(bindingNavigatorAddNewItem_Click);
		this.editToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.editToolStripButton.Image = ECS.Properties.Resources.Edit;
		resources.ApplyResources(this.editToolStripButton, "editToolStripButton");
		this.editToolStripButton.Name = "editToolStripButton";
		this.editToolStripButton.Click += new System.EventHandler(editToolStripButton_Click);
		this.exprClearToolStripButton.Image = ECS.Properties.Resources.New;
		resources.ApplyResources(this.exprClearToolStripButton, "exprClearToolStripButton");
		this.exprClearToolStripButton.Name = "exprClearToolStripButton";
		this.exprClearToolStripButton.Click += new System.EventHandler(clearToolStripButton_Click);
		this.groupBox1.Controls.Add(this.spf_CheckBox);
		this.groupBox1.Controls.Add(this.op1_NumericUpDown);
		this.groupBox1.Controls.Add(this.op2_NumericUpDown);
		this.groupBox1.Controls.Add(this.opComboBox);
		this.groupBox1.Controls.Add(this.fieldComboBox);
		this.groupBox1.Controls.Add(this.timeCheckBox);
		this.groupBox1.Controls.Add(this.pluComboBox);
		this.groupBox1.Controls.Add(this.filterButton);
		this.groupBox1.Controls.Add(this.toTimePicker);
		this.groupBox1.Controls.Add(this.toDatePicker);
		this.groupBox1.Controls.Add(this.fromDatePicker);
		this.groupBox1.Controls.Add(this.pluCheckBox);
		this.groupBox1.Controls.Add(this.fromTimePicker);
		this.groupBox1.Controls.Add(this.groupCheckBox);
		this.groupBox1.Controls.Add(this.toLabel);
		this.groupBox1.Controls.Add(this.fromLabel);
		this.groupBox1.Controls.Add(this.tableCheckBox);
		this.groupBox1.Controls.Add(this.groupComboBox);
		this.groupBox1.Controls.Add(this.deviceComboBox);
		resources.ApplyResources(this.groupBox1, "groupBox1");
		this.groupBox1.Name = "groupBox1";
		this.groupBox1.TabStop = false;
		resources.ApplyResources(this.spf_CheckBox, "spf_CheckBox");
		this.spf_CheckBox.Name = "spf_CheckBox";
		this.spf_CheckBox.UseVisualStyleBackColor = true;
		this.spf_CheckBox.CheckedChanged += new System.EventHandler(timeCheckBox_CheckedChanged);
		resources.ApplyResources(this.op1_NumericUpDown, "op1_NumericUpDown");
		this.op1_NumericUpDown.Maximum = new decimal(new int[4] { 99999999, 0, 0, 0 });
		this.op1_NumericUpDown.Name = "op1_NumericUpDown";
		this.op1_NumericUpDown.ValueChanged += new System.EventHandler(filter_Changed);
		resources.ApplyResources(this.op2_NumericUpDown, "op2_NumericUpDown");
		this.op2_NumericUpDown.Maximum = new decimal(new int[4] { 99999999, 0, 0, 0 });
		this.op2_NumericUpDown.Name = "op2_NumericUpDown";
		this.op2_NumericUpDown.ValueChanged += new System.EventHandler(filter_Changed);
		this.opComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		resources.ApplyResources(this.opComboBox, "opComboBox");
		this.opComboBox.FormattingEnabled = true;
		this.opComboBox.Items.AddRange(new object[7]
		{
			resources.GetString("opComboBox.Items"),
			resources.GetString("opComboBox.Items1"),
			resources.GetString("opComboBox.Items2"),
			resources.GetString("opComboBox.Items3"),
			resources.GetString("opComboBox.Items4"),
			resources.GetString("opComboBox.Items5"),
			resources.GetString("opComboBox.Items6")
		});
		this.opComboBox.Name = "opComboBox";
		this.opComboBox.SelectedIndexChanged += new System.EventHandler(opComboBox_SelectedIndexChanged);
		this.fieldComboBox.DataSource = this.report_ColBindingSource2;
		this.fieldComboBox.DisplayMember = "Display";
		this.fieldComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		resources.ApplyResources(this.fieldComboBox, "fieldComboBox");
		this.fieldComboBox.FormattingEnabled = true;
		this.fieldComboBox.Name = "fieldComboBox";
		this.fieldComboBox.ValueMember = "Field";
		this.fieldComboBox.SelectedIndexChanged += new System.EventHandler(fieldComboBox_SelectedIndexChanged);
		this.report_ColBindingSource2.DataMember = "Report_Col";
		this.report_ColBindingSource2.DataSource = this.uIDataSet;
		this.report_ColBindingSource2.Filter = "[Field] <> '' AND [Field] <> '[Device].[GID]' AND [Field] <> '[Device].[MAC]' AND [Field] <> '[LogItem].[Type]' AND [Field] <> '[Log].[DateTime]'";
		this.uIDataSet.DataSetName = "UIDataSet";
		this.uIDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uIDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.timeCheckBox, "timeCheckBox");
		this.timeCheckBox.Name = "timeCheckBox";
		this.timeCheckBox.UseVisualStyleBackColor = true;
		this.timeCheckBox.CheckedChanged += new System.EventHandler(timeCheckBox_CheckedChanged);
		this.pluComboBox.DataSource = this.pluBindingSource;
		this.pluComboBox.DisplayMember = "Name";
		this.pluComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		resources.ApplyResources(this.pluComboBox, "pluComboBox");
		this.pluComboBox.FormattingEnabled = true;
		this.pluComboBox.Name = "pluComboBox";
		this.pluComboBox.ValueMember = "PLUID";
		this.pluComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(pluComboBox_Format_1);
		this.pluComboBox.SelectedValueChanged += new System.EventHandler(filter_Changed);
		resources.ApplyResources(this.filterButton, "filterButton");
		this.filterButton.Name = "filterButton";
		this.filterButton.UseVisualStyleBackColor = true;
		this.filterButton.Click += new System.EventHandler(filterButton_Click);
		resources.ApplyResources(this.toTimePicker, "toTimePicker");
		this.toTimePicker.Format = System.Windows.Forms.DateTimePickerFormat.Time;
		this.toTimePicker.Name = "toTimePicker";
		this.toTimePicker.ShowUpDown = true;
		this.toTimePicker.ValueChanged += new System.EventHandler(filter_Changed);
		resources.ApplyResources(this.toDatePicker, "toDatePicker");
		this.toDatePicker.Format = System.Windows.Forms.DateTimePickerFormat.Short;
		this.toDatePicker.Name = "toDatePicker";
		this.toDatePicker.ValueChanged += new System.EventHandler(filter_Changed);
		resources.ApplyResources(this.fromDatePicker, "fromDatePicker");
		this.fromDatePicker.Format = System.Windows.Forms.DateTimePickerFormat.Short;
		this.fromDatePicker.Name = "fromDatePicker";
		this.fromDatePicker.ValueChanged += new System.EventHandler(filter_Changed);
		resources.ApplyResources(this.pluCheckBox, "pluCheckBox");
		this.pluCheckBox.Name = "pluCheckBox";
		this.pluCheckBox.UseVisualStyleBackColor = true;
		this.pluCheckBox.CheckedChanged += new System.EventHandler(timeCheckBox_CheckedChanged);
		resources.ApplyResources(this.fromTimePicker, "fromTimePicker");
		this.fromTimePicker.Format = System.Windows.Forms.DateTimePickerFormat.Time;
		this.fromTimePicker.Name = "fromTimePicker";
		this.fromTimePicker.ShowUpDown = true;
		this.fromTimePicker.ValueChanged += new System.EventHandler(filter_Changed);
		resources.ApplyResources(this.groupCheckBox, "groupCheckBox");
		this.groupCheckBox.Name = "groupCheckBox";
		this.groupCheckBox.UseVisualStyleBackColor = true;
		this.groupCheckBox.CheckedChanged += new System.EventHandler(timeCheckBox_CheckedChanged);
		resources.ApplyResources(this.toLabel, "toLabel");
		this.toLabel.Name = "toLabel";
		resources.ApplyResources(this.fromLabel, "fromLabel");
		this.fromLabel.Name = "fromLabel";
		resources.ApplyResources(this.tableCheckBox, "tableCheckBox");
		this.tableCheckBox.Name = "tableCheckBox";
		this.tableCheckBox.UseVisualStyleBackColor = true;
		this.tableCheckBox.CheckedChanged += new System.EventHandler(timeCheckBox_CheckedChanged);
		this.groupComboBox.DataSource = this.sGroupBindingSource1;
		this.groupComboBox.DisplayMember = "Name";
		this.groupComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		resources.ApplyResources(this.groupComboBox, "groupComboBox");
		this.groupComboBox.FormattingEnabled = true;
		this.groupComboBox.Name = "groupComboBox";
		this.groupComboBox.ValueMember = "GID";
		this.groupComboBox.SelectedValueChanged += new System.EventHandler(filter_Changed);
		this.sGroupBindingSource1.DataMember = "SGroup";
		this.sGroupBindingSource1.DataSource = this.reportDataSet;
		this.sGroupBindingSource1.ListChanged += new System.ComponentModel.ListChangedEventHandler(sGroupBindingSource1_ListChanged);
		this.deviceComboBox.DataSource = this.deviceBindingSource1;
		this.deviceComboBox.DisplayMember = "MAC";
		this.deviceComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		resources.ApplyResources(this.deviceComboBox, "deviceComboBox");
		this.deviceComboBox.FormattingEnabled = true;
		this.deviceComboBox.Name = "deviceComboBox";
		this.deviceComboBox.ValueMember = "TID";
		this.deviceComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(deviceComboBox_Format);
		this.deviceComboBox.SelectedValueChanged += new System.EventHandler(filter_Changed);
		this.deviceBindingSource1.DataMember = "Device";
		this.deviceBindingSource1.DataSource = this.reportDataSet;
		this.deviceBindingSource1.Filter = "";
		this.filterDoButton.ForeColor = System.Drawing.Color.Red;
		resources.ApplyResources(this.filterDoButton, "filterDoButton");
		this.filterDoButton.Name = "filterDoButton";
		this.filterDoButton.UseVisualStyleBackColor = true;
		this.filterDoButton.Click += new System.EventHandler(filterDoButton_Click);
		this.Analysis_ImExport_TabPage.Controls.Add(this.splitContainer3);
		resources.ApplyResources(this.Analysis_ImExport_TabPage, "Analysis_ImExport_TabPage");
		this.Analysis_ImExport_TabPage.Name = "Analysis_ImExport_TabPage";
		this.Analysis_ImExport_TabPage.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.splitContainer3, "splitContainer3");
		this.splitContainer3.Name = "splitContainer3";
		this.splitContainer3.Panel1.Controls.Add(this.excelDataGridView);
		this.splitContainer3.Panel1.Controls.Add(this.excelBindingNavigator);
		this.splitContainer3.Panel2.Controls.Add(this.exeButton);
		this.excelDataGridView.AllowUserToAddRows = false;
		this.excelDataGridView.AutoGenerateColumns = false;
		this.excelDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.excelDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.excelDataGridView, "excelDataGridView");
		this.excelDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.excelDataGridView.Columns.AddRange(this.fieldColumn, this.idDataGridViewTextBoxColumn1);
		this.excelDataGridView.DataSource = this.excelBindingSource;
		this.excelDataGridView.Name = "excelDataGridView";
		this.excelDataGridView.RowTemplate.Height = 23;
		this.excelDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.excelDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(excelDataGridView_DataError);
		this.fieldColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.fieldColumn.DataPropertyName = "Field";
		this.fieldColumn.DataSource = this.report_ColBindingSource;
		this.fieldColumn.DisplayMember = "Display";
		resources.ApplyResources(this.fieldColumn, "fieldColumn");
		this.fieldColumn.Name = "fieldColumn";
		this.fieldColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.fieldColumn.ValueMember = "Field";
		this.report_ColBindingSource.DataMember = "Report_Col";
		this.report_ColBindingSource.DataSource = this.uIDataSet;
		this.report_ColBindingSource.Filter = "[Field] <> ''";
		this.idDataGridViewTextBoxColumn1.DataPropertyName = "ID";
		resources.ApplyResources(this.idDataGridViewTextBoxColumn1, "idDataGridViewTextBoxColumn1");
		this.idDataGridViewTextBoxColumn1.Name = "idDataGridViewTextBoxColumn1";
		this.idDataGridViewTextBoxColumn1.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
		this.excelBindingSource.DataMember = "Excel";
		this.excelBindingSource.DataSource = this.reportDataSet;
		this.excelBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem2;
		this.excelBindingNavigator.BindingSource = this.excelBindingSource;
		this.excelBindingNavigator.CountItem = this.bindingNavigatorCountItem2;
		this.excelBindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem2;
		this.excelBindingNavigator.GripStyle = System.Windows.Forms.ToolStripGripStyle.Hidden;
		this.excelBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[13]
		{
			this.bindingNavigatorMoveFirstItem2, this.bindingNavigatorMovePreviousItem2, this.bindingNavigatorSeparator6, this.bindingNavigatorPositionItem2, this.bindingNavigatorCountItem2, this.bindingNavigatorSeparator7, this.bindingNavigatorMoveNextItem2, this.bindingNavigatorMoveLastItem2, this.bindingNavigatorSeparator8, this.bindingNavigatorAddNewItem2,
			this.bindingNavigatorDeleteItem2, this.addAllToolStripButton, this.clearToolStripButton
		});
		resources.ApplyResources(this.excelBindingNavigator, "excelBindingNavigator");
		this.excelBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem2;
		this.excelBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem2;
		this.excelBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem2;
		this.excelBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem2;
		this.excelBindingNavigator.Name = "excelBindingNavigator";
		this.excelBindingNavigator.PositionItem = this.bindingNavigatorPositionItem2;
		this.bindingNavigatorAddNewItem2.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorAddNewItem2.Image = ECS.Properties.Resources.bindingNavigatorAddNewItem;
		this.bindingNavigatorAddNewItem2.Name = "bindingNavigatorAddNewItem2";
		resources.ApplyResources(this.bindingNavigatorAddNewItem2, "bindingNavigatorAddNewItem2");
		this.bindingNavigatorCountItem2.Name = "bindingNavigatorCountItem2";
		resources.ApplyResources(this.bindingNavigatorCountItem2, "bindingNavigatorCountItem2");
		this.bindingNavigatorDeleteItem2.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorDeleteItem2.Image = ECS.Properties.Resources.bindingNavigatorDeleteItem;
		this.bindingNavigatorDeleteItem2.Name = "bindingNavigatorDeleteItem2";
		resources.ApplyResources(this.bindingNavigatorDeleteItem2, "bindingNavigatorDeleteItem2");
		this.bindingNavigatorMoveFirstItem2.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveFirstItem2.Image = ECS.Properties.Resources.bindingNavigatorMoveFirstItem;
		this.bindingNavigatorMoveFirstItem2.Name = "bindingNavigatorMoveFirstItem2";
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem2, "bindingNavigatorMoveFirstItem2");
		this.bindingNavigatorMovePreviousItem2.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMovePreviousItem2.Image = ECS.Properties.Resources.bindingNavigatorMovePreviousItem;
		this.bindingNavigatorMovePreviousItem2.Name = "bindingNavigatorMovePreviousItem2";
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem2, "bindingNavigatorMovePreviousItem2");
		this.bindingNavigatorSeparator6.Name = "bindingNavigatorSeparator6";
		resources.ApplyResources(this.bindingNavigatorSeparator6, "bindingNavigatorSeparator6");
		resources.ApplyResources(this.bindingNavigatorPositionItem2, "bindingNavigatorPositionItem2");
		this.bindingNavigatorPositionItem2.Name = "bindingNavigatorPositionItem2";
		this.bindingNavigatorSeparator7.Name = "bindingNavigatorSeparator7";
		resources.ApplyResources(this.bindingNavigatorSeparator7, "bindingNavigatorSeparator7");
		this.bindingNavigatorMoveNextItem2.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveNextItem2.Image = ECS.Properties.Resources.bindingNavigatorMoveNextItem;
		this.bindingNavigatorMoveNextItem2.Name = "bindingNavigatorMoveNextItem2";
		resources.ApplyResources(this.bindingNavigatorMoveNextItem2, "bindingNavigatorMoveNextItem2");
		this.bindingNavigatorMoveLastItem2.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveLastItem2.Image = ECS.Properties.Resources.bindingNavigatorMoveLastItem;
		this.bindingNavigatorMoveLastItem2.Name = "bindingNavigatorMoveLastItem2";
		resources.ApplyResources(this.bindingNavigatorMoveLastItem2, "bindingNavigatorMoveLastItem2");
		this.bindingNavigatorSeparator8.Name = "bindingNavigatorSeparator8";
		resources.ApplyResources(this.bindingNavigatorSeparator8, "bindingNavigatorSeparator8");
		this.addAllToolStripButton.Image = ECS.Properties.Resources.Repeat;
		resources.ApplyResources(this.addAllToolStripButton, "addAllToolStripButton");
		this.addAllToolStripButton.Name = "addAllToolStripButton";
		this.addAllToolStripButton.Click += new System.EventHandler(addAllToolStripButton_Click);
		this.clearToolStripButton.Image = ECS.Properties.Resources.New;
		resources.ApplyResources(this.clearToolStripButton, "clearToolStripButton");
		this.clearToolStripButton.Name = "clearToolStripButton";
		this.clearToolStripButton.Click += new System.EventHandler(excelClearToolStripButton_Click);
		resources.ApplyResources(this.exeButton, "exeButton");
		this.exeButton.Name = "exeButton";
		this.exeButton.UseVisualStyleBackColor = true;
		this.exeButton.Click += new System.EventHandler(exeButton_Click);
		this.Analysis_Right_TabControl.Controls.Add(this.List_TabPage);
		this.Analysis_Right_TabControl.Controls.Add(this.Report_TabPage);
		resources.ApplyResources(this.Analysis_Right_TabControl, "Analysis_Right_TabControl");
		this.Analysis_Right_TabControl.Multiline = true;
		this.Analysis_Right_TabControl.Name = "Analysis_Right_TabControl";
		this.Analysis_Right_TabControl.SelectedIndex = 0;
		this.List_TabPage.Controls.Add(this.splitContainer5);
		resources.ApplyResources(this.List_TabPage, "List_TabPage");
		this.List_TabPage.Name = "List_TabPage";
		this.List_TabPage.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.splitContainer5, "splitContainer5");
		this.splitContainer5.Name = "splitContainer5";
		this.splitContainer5.Panel1.Controls.Add(this.dataGridView1);
		this.splitContainer5.Panel1.Controls.Add(this.resultlogBindingNavigator);
		this.splitContainer5.Panel2.Controls.Add(this.resultDataGridView);
		this.splitContainer5.Panel2.Controls.Add(this.resultBindingNavigator);
		this.dataGridView1.AllowUserToAddRows = false;
		this.dataGridView1.AllowUserToDeleteRows = false;
		this.dataGridView1.AutoGenerateColumns = false;
		this.dataGridView1.BackgroundColor = System.Drawing.SystemColors.Window;
		this.dataGridView1.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.dataGridView1, "dataGridView1");
		this.dataGridView1.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.dataGridView1.Columns.AddRange(this.mACDataGridViewTextBoxColumn5, this.nameDataGridViewTextBoxColumn5, this.fIDDataGridViewTextBoxColumn5, this.dateTimeDataGridViewTextBoxColumn5, this.sIDDataGridViewTextBoxColumn5, this.subNoDataGridViewTextBoxColumn2, this.paymentTotalDataGridViewTextBoxColumn2, this.taxDataGridViewTextBoxColumn5, this.costDataGridViewTextBoxColumn5, this.salesmanDataGridViewTextBoxColumn5, this.disRoundDataGridViewTextBoxColumn2, this.epay0DataGridViewTextBoxColumn2, this.epay1DataGridViewTextBoxColumn2, this.epay2DataGridViewTextBoxColumn2, this.epay3DataGridViewTextBoxColumn2, this.epay4DataGridViewTextBoxColumn2, this.epay5DataGridViewTextBoxColumn2, this.epay6DataGridViewTextBoxColumn2, this.epay7DataGridViewTextBoxColumn2, this.paymentCardDataGridViewTextBoxColumn2, this.paymentOther1DataGridViewTextBoxColumn2, this.paymentOther2DataGridViewTextBoxColumn2, this.paymentOther3DataGridViewTextBoxColumn2, this.sfeeDataGridViewTextBoxColumn2);
		this.dataGridView1.DataSource = this.resultLogBindingSource;
		this.dataGridView1.Name = "dataGridView1";
		this.dataGridView1.RowTemplate.Height = 23;
		this.mACDataGridViewTextBoxColumn5.DataPropertyName = "MAC";
		resources.ApplyResources(this.mACDataGridViewTextBoxColumn5, "mACDataGridViewTextBoxColumn5");
		this.mACDataGridViewTextBoxColumn5.Name = "mACDataGridViewTextBoxColumn5";
		this.nameDataGridViewTextBoxColumn5.DataPropertyName = "Name";
		resources.ApplyResources(this.nameDataGridViewTextBoxColumn5, "nameDataGridViewTextBoxColumn5");
		this.nameDataGridViewTextBoxColumn5.Name = "nameDataGridViewTextBoxColumn5";
		this.fIDDataGridViewTextBoxColumn5.DataPropertyName = "FID";
		resources.ApplyResources(this.fIDDataGridViewTextBoxColumn5, "fIDDataGridViewTextBoxColumn5");
		this.fIDDataGridViewTextBoxColumn5.Name = "fIDDataGridViewTextBoxColumn5";
		this.dateTimeDataGridViewTextBoxColumn5.DataPropertyName = "DateTime";
		resources.ApplyResources(this.dateTimeDataGridViewTextBoxColumn5, "dateTimeDataGridViewTextBoxColumn5");
		this.dateTimeDataGridViewTextBoxColumn5.Name = "dateTimeDataGridViewTextBoxColumn5";
		this.sIDDataGridViewTextBoxColumn5.DataPropertyName = "SID";
		resources.ApplyResources(this.sIDDataGridViewTextBoxColumn5, "sIDDataGridViewTextBoxColumn5");
		this.sIDDataGridViewTextBoxColumn5.Name = "sIDDataGridViewTextBoxColumn5";
		this.subNoDataGridViewTextBoxColumn2.DataPropertyName = "SubNo";
		resources.ApplyResources(this.subNoDataGridViewTextBoxColumn2, "subNoDataGridViewTextBoxColumn2");
		this.subNoDataGridViewTextBoxColumn2.Name = "subNoDataGridViewTextBoxColumn2";
		this.paymentTotalDataGridViewTextBoxColumn2.DataPropertyName = "Payment_Total";
		resources.ApplyResources(this.paymentTotalDataGridViewTextBoxColumn2, "paymentTotalDataGridViewTextBoxColumn2");
		this.paymentTotalDataGridViewTextBoxColumn2.Name = "paymentTotalDataGridViewTextBoxColumn2";
		this.taxDataGridViewTextBoxColumn5.DataPropertyName = "Tax";
		resources.ApplyResources(this.taxDataGridViewTextBoxColumn5, "taxDataGridViewTextBoxColumn5");
		this.taxDataGridViewTextBoxColumn5.Name = "taxDataGridViewTextBoxColumn5";
		this.costDataGridViewTextBoxColumn5.DataPropertyName = "Cost";
		resources.ApplyResources(this.costDataGridViewTextBoxColumn5, "costDataGridViewTextBoxColumn5");
		this.costDataGridViewTextBoxColumn5.Name = "costDataGridViewTextBoxColumn5";
		this.salesmanDataGridViewTextBoxColumn5.DataPropertyName = "Salesman";
		resources.ApplyResources(this.salesmanDataGridViewTextBoxColumn5, "salesmanDataGridViewTextBoxColumn5");
		this.salesmanDataGridViewTextBoxColumn5.Name = "salesmanDataGridViewTextBoxColumn5";
		this.disRoundDataGridViewTextBoxColumn2.DataPropertyName = "DisRound";
		resources.ApplyResources(this.disRoundDataGridViewTextBoxColumn2, "disRoundDataGridViewTextBoxColumn2");
		this.disRoundDataGridViewTextBoxColumn2.Name = "disRoundDataGridViewTextBoxColumn2";
		this.epay0DataGridViewTextBoxColumn2.DataPropertyName = "Alipay";
		resources.ApplyResources(this.epay0DataGridViewTextBoxColumn2, "epay0DataGridViewTextBoxColumn2");
		this.epay0DataGridViewTextBoxColumn2.Name = "epay0DataGridViewTextBoxColumn2";
		this.epay1DataGridViewTextBoxColumn2.DataPropertyName = "WXpay";
		resources.ApplyResources(this.epay1DataGridViewTextBoxColumn2, "epay1DataGridViewTextBoxColumn2");
		this.epay1DataGridViewTextBoxColumn2.Name = "epay1DataGridViewTextBoxColumn2";
		this.epay2DataGridViewTextBoxColumn2.DataPropertyName = "Epay2";
		resources.ApplyResources(this.epay2DataGridViewTextBoxColumn2, "epay2DataGridViewTextBoxColumn2");
		this.epay2DataGridViewTextBoxColumn2.Name = "epay2DataGridViewTextBoxColumn2";
		this.epay3DataGridViewTextBoxColumn2.DataPropertyName = "Epay3";
		resources.ApplyResources(this.epay3DataGridViewTextBoxColumn2, "epay3DataGridViewTextBoxColumn2");
		this.epay3DataGridViewTextBoxColumn2.Name = "epay3DataGridViewTextBoxColumn2";
		this.epay4DataGridViewTextBoxColumn2.DataPropertyName = "Epay4";
		resources.ApplyResources(this.epay4DataGridViewTextBoxColumn2, "epay4DataGridViewTextBoxColumn2");
		this.epay4DataGridViewTextBoxColumn2.Name = "epay4DataGridViewTextBoxColumn2";
		this.epay5DataGridViewTextBoxColumn2.DataPropertyName = "Epay5";
		resources.ApplyResources(this.epay5DataGridViewTextBoxColumn2, "epay5DataGridViewTextBoxColumn2");
		this.epay5DataGridViewTextBoxColumn2.Name = "epay5DataGridViewTextBoxColumn2";
		this.epay6DataGridViewTextBoxColumn2.DataPropertyName = "Epay6";
		resources.ApplyResources(this.epay6DataGridViewTextBoxColumn2, "epay6DataGridViewTextBoxColumn2");
		this.epay6DataGridViewTextBoxColumn2.Name = "epay6DataGridViewTextBoxColumn2";
		this.epay7DataGridViewTextBoxColumn2.DataPropertyName = "Epay7";
		resources.ApplyResources(this.epay7DataGridViewTextBoxColumn2, "epay7DataGridViewTextBoxColumn2");
		this.epay7DataGridViewTextBoxColumn2.Name = "epay7DataGridViewTextBoxColumn2";
		this.paymentCardDataGridViewTextBoxColumn2.DataPropertyName = "Payment_Card";
		resources.ApplyResources(this.paymentCardDataGridViewTextBoxColumn2, "paymentCardDataGridViewTextBoxColumn2");
		this.paymentCardDataGridViewTextBoxColumn2.Name = "paymentCardDataGridViewTextBoxColumn2";
		this.paymentOther1DataGridViewTextBoxColumn2.DataPropertyName = "Payment_Other_1";
		resources.ApplyResources(this.paymentOther1DataGridViewTextBoxColumn2, "paymentOther1DataGridViewTextBoxColumn2");
		this.paymentOther1DataGridViewTextBoxColumn2.Name = "paymentOther1DataGridViewTextBoxColumn2";
		this.paymentOther2DataGridViewTextBoxColumn2.DataPropertyName = "Payment_Other_2";
		resources.ApplyResources(this.paymentOther2DataGridViewTextBoxColumn2, "paymentOther2DataGridViewTextBoxColumn2");
		this.paymentOther2DataGridViewTextBoxColumn2.Name = "paymentOther2DataGridViewTextBoxColumn2";
		this.paymentOther3DataGridViewTextBoxColumn2.DataPropertyName = "Payment_Other_3";
		resources.ApplyResources(this.paymentOther3DataGridViewTextBoxColumn2, "paymentOther3DataGridViewTextBoxColumn2");
		this.paymentOther3DataGridViewTextBoxColumn2.Name = "paymentOther3DataGridViewTextBoxColumn2";
		this.sfeeDataGridViewTextBoxColumn2.DataPropertyName = "Sfee";
		resources.ApplyResources(this.sfeeDataGridViewTextBoxColumn2, "sfeeDataGridViewTextBoxColumn2");
		this.sfeeDataGridViewTextBoxColumn2.Name = "sfeeDataGridViewTextBoxColumn2";
		this.resultlogBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem9;
		this.resultlogBindingNavigator.CountItem = this.bindingNavigatorCountItem9;
		this.resultlogBindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem9;
		this.resultlogBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.bindingNavigatorMoveFirstItem9, this.bindingNavigatorMovePreviousItem9, this.bindingNavigatorSeparator27, this.bindingNavigatorPositionItem9, this.bindingNavigatorCountItem9, this.bindingNavigatorSeparator28, this.bindingNavigatorMoveNextItem9, this.bindingNavigatorMoveLastItem9, this.bindingNavigatorSeparator29, this.bindingNavigatorAddNewItem9,
			this.bindingNavigatorDeleteItem9
		});
		resources.ApplyResources(this.resultlogBindingNavigator, "resultlogBindingNavigator");
		this.resultlogBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem9;
		this.resultlogBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem9;
		this.resultlogBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem9;
		this.resultlogBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem9;
		this.resultlogBindingNavigator.Name = "resultlogBindingNavigator";
		this.resultlogBindingNavigator.PositionItem = this.bindingNavigatorPositionItem9;
		this.bindingNavigatorAddNewItem9.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem9, "bindingNavigatorAddNewItem9");
		this.bindingNavigatorAddNewItem9.Name = "bindingNavigatorAddNewItem9";
		this.bindingNavigatorCountItem9.Name = "bindingNavigatorCountItem9";
		resources.ApplyResources(this.bindingNavigatorCountItem9, "bindingNavigatorCountItem9");
		this.bindingNavigatorDeleteItem9.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem9, "bindingNavigatorDeleteItem9");
		this.bindingNavigatorDeleteItem9.Name = "bindingNavigatorDeleteItem9";
		this.bindingNavigatorMoveFirstItem9.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem9, "bindingNavigatorMoveFirstItem9");
		this.bindingNavigatorMoveFirstItem9.Name = "bindingNavigatorMoveFirstItem9";
		this.bindingNavigatorMovePreviousItem9.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem9, "bindingNavigatorMovePreviousItem9");
		this.bindingNavigatorMovePreviousItem9.Name = "bindingNavigatorMovePreviousItem9";
		this.bindingNavigatorSeparator27.Name = "bindingNavigatorSeparator27";
		resources.ApplyResources(this.bindingNavigatorSeparator27, "bindingNavigatorSeparator27");
		resources.ApplyResources(this.bindingNavigatorPositionItem9, "bindingNavigatorPositionItem9");
		this.bindingNavigatorPositionItem9.Name = "bindingNavigatorPositionItem9";
		this.bindingNavigatorSeparator28.Name = "bindingNavigatorSeparator28";
		resources.ApplyResources(this.bindingNavigatorSeparator28, "bindingNavigatorSeparator28");
		this.bindingNavigatorMoveNextItem9.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem9, "bindingNavigatorMoveNextItem9");
		this.bindingNavigatorMoveNextItem9.Name = "bindingNavigatorMoveNextItem9";
		this.bindingNavigatorMoveLastItem9.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem9, "bindingNavigatorMoveLastItem9");
		this.bindingNavigatorMoveLastItem9.Name = "bindingNavigatorMoveLastItem9";
		this.bindingNavigatorSeparator29.Name = "bindingNavigatorSeparator29";
		resources.ApplyResources(this.bindingNavigatorSeparator29, "bindingNavigatorSeparator29");
		this.resultDataGridView.AllowUserToAddRows = false;
		this.resultDataGridView.AllowUserToDeleteRows = false;
		this.resultDataGridView.AutoGenerateColumns = false;
		this.resultDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.resultDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.resultDataGridView, "resultDataGridView");
		this.resultDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.resultDataGridView.Columns.AddRange(this.macDataGridViewTextBoxColumn, this.nameDataGridViewTextBoxColumn, this.fidDataGridViewTextBoxColumn, this.dateTimeDataGridViewTextBoxColumn, this.sidDataGridViewTextBoxColumn, this.salesmanDataGridViewTextBoxColumn, this.subidDataGridViewTextBoxColumn, this.pluDataGridViewTextBoxColumn, this.pLUDataGridViewComboBoxColumn, this.amountDataGridViewTextBoxColumn, this.unitDataGridViewTextBoxColumn, this.unitDataGridViewComboBoxColumn, this.unitPriceDataGridViewTextBoxColumn, this.priceDataGridViewTextBoxColumn, this.deptDataGridViewTextBoxColumn, this.classDataGridViewTextBoxColumn, this.costDataGridViewTextBoxColumn, this.typeDataGridViewComboBoxColumn, this.cofidDataGridViewTextBoxColumn, this.taxDataGridViewTextBoxColumn, this._Text1Column, this._Text2Column, this._Text3Column, this._Text4Column);
		this.resultDataGridView.DataSource = this.resultLogItemBindingSource;
		this.resultDataGridView.Name = "resultDataGridView";
		this.resultDataGridView.ReadOnly = true;
		this.resultDataGridView.RowTemplate.Height = 23;
		this.resultDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(resultDataGridView_DataError);
		this.macDataGridViewTextBoxColumn.DataPropertyName = "MAC";
		resources.ApplyResources(this.macDataGridViewTextBoxColumn, "macDataGridViewTextBoxColumn");
		this.macDataGridViewTextBoxColumn.Name = "macDataGridViewTextBoxColumn";
		this.macDataGridViewTextBoxColumn.ReadOnly = true;
		this.nameDataGridViewTextBoxColumn.DataPropertyName = "Name";
		resources.ApplyResources(this.nameDataGridViewTextBoxColumn, "nameDataGridViewTextBoxColumn");
		this.nameDataGridViewTextBoxColumn.Name = "nameDataGridViewTextBoxColumn";
		this.nameDataGridViewTextBoxColumn.ReadOnly = true;
		this.fidDataGridViewTextBoxColumn.DataPropertyName = "FID";
		resources.ApplyResources(this.fidDataGridViewTextBoxColumn, "fidDataGridViewTextBoxColumn");
		this.fidDataGridViewTextBoxColumn.Name = "fidDataGridViewTextBoxColumn";
		this.fidDataGridViewTextBoxColumn.ReadOnly = true;
		this.dateTimeDataGridViewTextBoxColumn.DataPropertyName = "DateTime";
		dataGridViewCellStyle.Format = "G";
		dataGridViewCellStyle.NullValue = null;
		this.dateTimeDataGridViewTextBoxColumn.DefaultCellStyle = dataGridViewCellStyle;
		resources.ApplyResources(this.dateTimeDataGridViewTextBoxColumn, "dateTimeDataGridViewTextBoxColumn");
		this.dateTimeDataGridViewTextBoxColumn.Name = "dateTimeDataGridViewTextBoxColumn";
		this.dateTimeDataGridViewTextBoxColumn.ReadOnly = true;
		this.sidDataGridViewTextBoxColumn.DataPropertyName = "SID";
		resources.ApplyResources(this.sidDataGridViewTextBoxColumn, "sidDataGridViewTextBoxColumn");
		this.sidDataGridViewTextBoxColumn.Name = "sidDataGridViewTextBoxColumn";
		this.sidDataGridViewTextBoxColumn.ReadOnly = true;
		this.salesmanDataGridViewTextBoxColumn.DataPropertyName = "Salesman";
		resources.ApplyResources(this.salesmanDataGridViewTextBoxColumn, "salesmanDataGridViewTextBoxColumn");
		this.salesmanDataGridViewTextBoxColumn.Name = "salesmanDataGridViewTextBoxColumn";
		this.salesmanDataGridViewTextBoxColumn.ReadOnly = true;
		this.subidDataGridViewTextBoxColumn.DataPropertyName = "SubID";
		resources.ApplyResources(this.subidDataGridViewTextBoxColumn, "subidDataGridViewTextBoxColumn");
		this.subidDataGridViewTextBoxColumn.Name = "subidDataGridViewTextBoxColumn";
		this.subidDataGridViewTextBoxColumn.ReadOnly = true;
		this.pluDataGridViewTextBoxColumn.DataPropertyName = "PLU";
		resources.ApplyResources(this.pluDataGridViewTextBoxColumn, "pluDataGridViewTextBoxColumn");
		this.pluDataGridViewTextBoxColumn.Name = "pluDataGridViewTextBoxColumn";
		this.pluDataGridViewTextBoxColumn.ReadOnly = true;
		this.pLUDataGridViewComboBoxColumn.DataPropertyName = "PLUName";
		resources.ApplyResources(this.pLUDataGridViewComboBoxColumn, "pLUDataGridViewComboBoxColumn");
		this.pLUDataGridViewComboBoxColumn.Name = "pLUDataGridViewComboBoxColumn";
		this.pLUDataGridViewComboBoxColumn.ReadOnly = true;
		this.pLUDataGridViewComboBoxColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.amountDataGridViewTextBoxColumn.DataPropertyName = "Amount";
		resources.ApplyResources(this.amountDataGridViewTextBoxColumn, "amountDataGridViewTextBoxColumn");
		this.amountDataGridViewTextBoxColumn.Name = "amountDataGridViewTextBoxColumn";
		this.amountDataGridViewTextBoxColumn.ReadOnly = true;
		this.unitDataGridViewTextBoxColumn.DataPropertyName = "Unit";
		resources.ApplyResources(this.unitDataGridViewTextBoxColumn, "unitDataGridViewTextBoxColumn");
		this.unitDataGridViewTextBoxColumn.Name = "unitDataGridViewTextBoxColumn";
		this.unitDataGridViewTextBoxColumn.ReadOnly = true;
		this.unitDataGridViewComboBoxColumn.DataPropertyName = "Unit";
		this.unitDataGridViewComboBoxColumn.DataSource = this.unitBindingSource;
		this.unitDataGridViewComboBoxColumn.DisplayMember = "Pamount";
		resources.ApplyResources(this.unitDataGridViewComboBoxColumn, "unitDataGridViewComboBoxColumn");
		this.unitDataGridViewComboBoxColumn.Name = "unitDataGridViewComboBoxColumn";
		this.unitDataGridViewComboBoxColumn.ReadOnly = true;
		this.unitDataGridViewComboBoxColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.unitDataGridViewComboBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.unitDataGridViewComboBoxColumn.ValueMember = "UnitID";
		this.unitPriceDataGridViewTextBoxColumn.DataPropertyName = "UnitPrice";
		resources.ApplyResources(this.unitPriceDataGridViewTextBoxColumn, "unitPriceDataGridViewTextBoxColumn");
		this.unitPriceDataGridViewTextBoxColumn.Name = "unitPriceDataGridViewTextBoxColumn";
		this.unitPriceDataGridViewTextBoxColumn.ReadOnly = true;
		this.priceDataGridViewTextBoxColumn.DataPropertyName = "Price";
		resources.ApplyResources(this.priceDataGridViewTextBoxColumn, "priceDataGridViewTextBoxColumn");
		this.priceDataGridViewTextBoxColumn.Name = "priceDataGridViewTextBoxColumn";
		this.priceDataGridViewTextBoxColumn.ReadOnly = true;
		this.deptDataGridViewTextBoxColumn.DataPropertyName = "Dept";
		resources.ApplyResources(this.deptDataGridViewTextBoxColumn, "deptDataGridViewTextBoxColumn");
		this.deptDataGridViewTextBoxColumn.Name = "deptDataGridViewTextBoxColumn";
		this.deptDataGridViewTextBoxColumn.ReadOnly = true;
		this.classDataGridViewTextBoxColumn.DataPropertyName = "Class";
		resources.ApplyResources(this.classDataGridViewTextBoxColumn, "classDataGridViewTextBoxColumn");
		this.classDataGridViewTextBoxColumn.Name = "classDataGridViewTextBoxColumn";
		this.classDataGridViewTextBoxColumn.ReadOnly = true;
		this.costDataGridViewTextBoxColumn.DataPropertyName = "Cost";
		resources.ApplyResources(this.costDataGridViewTextBoxColumn, "costDataGridViewTextBoxColumn");
		this.costDataGridViewTextBoxColumn.Name = "costDataGridViewTextBoxColumn";
		this.costDataGridViewTextBoxColumn.ReadOnly = true;
		this.typeDataGridViewComboBoxColumn.DataPropertyName = "Type";
		this.typeDataGridViewComboBoxColumn.DataSource = this.logType2BindingSource;
		this.typeDataGridViewComboBoxColumn.DisplayMember = "Name";
		resources.ApplyResources(this.typeDataGridViewComboBoxColumn, "typeDataGridViewComboBoxColumn");
		this.typeDataGridViewComboBoxColumn.Name = "typeDataGridViewComboBoxColumn";
		this.typeDataGridViewComboBoxColumn.ReadOnly = true;
		this.typeDataGridViewComboBoxColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.typeDataGridViewComboBoxColumn.ValueMember = "TypeID";
		this.logType2BindingSource.AllowNew = false;
		this.logType2BindingSource.DataMember = "rLogsType";
		this.logType2BindingSource.DataSource = this.reportDataSet;
		this.cofidDataGridViewTextBoxColumn.DataPropertyName = "CoFID";
		resources.ApplyResources(this.cofidDataGridViewTextBoxColumn, "cofidDataGridViewTextBoxColumn");
		this.cofidDataGridViewTextBoxColumn.Name = "cofidDataGridViewTextBoxColumn";
		this.cofidDataGridViewTextBoxColumn.ReadOnly = true;
		this.taxDataGridViewTextBoxColumn.DataPropertyName = "Tax";
		resources.ApplyResources(this.taxDataGridViewTextBoxColumn, "taxDataGridViewTextBoxColumn");
		this.taxDataGridViewTextBoxColumn.Name = "taxDataGridViewTextBoxColumn";
		this.taxDataGridViewTextBoxColumn.ReadOnly = true;
		this._Text1Column.DataPropertyName = "Text1";
		resources.ApplyResources(this._Text1Column, "_Text1Column");
		this._Text1Column.Name = "_Text1Column";
		this._Text1Column.ReadOnly = true;
		this._Text2Column.DataPropertyName = "Text2";
		resources.ApplyResources(this._Text2Column, "_Text2Column");
		this._Text2Column.Name = "_Text2Column";
		this._Text2Column.ReadOnly = true;
		this._Text3Column.DataPropertyName = "Text3";
		resources.ApplyResources(this._Text3Column, "_Text3Column");
		this._Text3Column.Name = "_Text3Column";
		this._Text3Column.ReadOnly = true;
		this._Text4Column.DataPropertyName = "Text4";
		resources.ApplyResources(this._Text4Column, "_Text4Column");
		this._Text4Column.Name = "_Text4Column";
		this._Text4Column.ReadOnly = true;
		this.resultBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem1;
		this.resultBindingNavigator.CountItem = this.bindingNavigatorCountItem1;
		this.resultBindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem1;
		this.resultBindingNavigator.GripStyle = System.Windows.Forms.ToolStripGripStyle.Hidden;
		this.resultBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.bindingNavigatorMoveFirstItem1, this.bindingNavigatorMovePreviousItem1, this.bindingNavigatorSeparator3, this.bindingNavigatorPositionItem1, this.bindingNavigatorCountItem1, this.bindingNavigatorSeparator4, this.bindingNavigatorMoveNextItem1, this.bindingNavigatorMoveLastItem1, this.bindingNavigatorSeparator14, this.bindingNavigatorAddNewItem1,
			this.bindingNavigatorDeleteItem1
		});
		resources.ApplyResources(this.resultBindingNavigator, "resultBindingNavigator");
		this.resultBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem1;
		this.resultBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem1;
		this.resultBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem1;
		this.resultBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem1;
		this.resultBindingNavigator.Name = "resultBindingNavigator";
		this.resultBindingNavigator.PositionItem = this.bindingNavigatorPositionItem1;
		this.bindingNavigatorAddNewItem1.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem1, "bindingNavigatorAddNewItem1");
		this.bindingNavigatorAddNewItem1.Name = "bindingNavigatorAddNewItem1";
		this.bindingNavigatorCountItem1.Name = "bindingNavigatorCountItem1";
		resources.ApplyResources(this.bindingNavigatorCountItem1, "bindingNavigatorCountItem1");
		this.bindingNavigatorDeleteItem1.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem1, "bindingNavigatorDeleteItem1");
		this.bindingNavigatorDeleteItem1.Name = "bindingNavigatorDeleteItem1";
		this.bindingNavigatorMoveFirstItem1.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem1, "bindingNavigatorMoveFirstItem1");
		this.bindingNavigatorMoveFirstItem1.Name = "bindingNavigatorMoveFirstItem1";
		this.bindingNavigatorMovePreviousItem1.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem1, "bindingNavigatorMovePreviousItem1");
		this.bindingNavigatorMovePreviousItem1.Name = "bindingNavigatorMovePreviousItem1";
		this.bindingNavigatorSeparator3.Name = "bindingNavigatorSeparator3";
		resources.ApplyResources(this.bindingNavigatorSeparator3, "bindingNavigatorSeparator3");
		resources.ApplyResources(this.bindingNavigatorPositionItem1, "bindingNavigatorPositionItem1");
		this.bindingNavigatorPositionItem1.Name = "bindingNavigatorPositionItem1";
		this.bindingNavigatorSeparator4.Name = "bindingNavigatorSeparator4";
		resources.ApplyResources(this.bindingNavigatorSeparator4, "bindingNavigatorSeparator4");
		this.bindingNavigatorMoveNextItem1.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem1, "bindingNavigatorMoveNextItem1");
		this.bindingNavigatorMoveNextItem1.Name = "bindingNavigatorMoveNextItem1";
		this.bindingNavigatorMoveLastItem1.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem1, "bindingNavigatorMoveLastItem1");
		this.bindingNavigatorMoveLastItem1.Name = "bindingNavigatorMoveLastItem1";
		this.bindingNavigatorSeparator14.Name = "bindingNavigatorSeparator14";
		resources.ApplyResources(this.bindingNavigatorSeparator14, "bindingNavigatorSeparator14");
		this.Report_TabPage.Controls.Add(this.reportViewer1);
		resources.ApplyResources(this.Report_TabPage, "Report_TabPage");
		this.Report_TabPage.Name = "Report_TabPage";
		this.Report_TabPage.UseVisualStyleBackColor = true;
		this.reportViewer1.BorderStyle = System.Windows.Forms.BorderStyle.None;
		resources.ApplyResources(this.reportViewer1, "reportViewer1");
		reportDataSource.Name = "RS_LogItem";
		reportDataSource.Value = this.resultLogItemBindingSource;
		reportDataSource2.Name = "RS_Log";
		reportDataSource2.Value = this.resultLogBindingSource;
		this.reportViewer1.LocalReport.DataSources.Add(reportDataSource);
		this.reportViewer1.LocalReport.DataSources.Add(reportDataSource2);
		this.reportViewer1.LocalReport.ReportEmbeddedResource = "ECS.Query_A4.rdlc";
		this.reportViewer1.Name = "reportViewer1";
		this.reportViewer1.ShowBackButton = false;
		resources.ApplyResources(this.splitContainer2, "splitContainer2");
		this.splitContainer2.Name = "splitContainer2";
		this.splitContainer2.Panel1.Controls.Add(this.splitContainer4);
		this.splitContainer2.Panel2.Controls.Add(this.stockDataGridView);
		this.splitContainer2.Panel2.Controls.Add(this.stockBindingNavigator);
		resources.ApplyResources(this.splitContainer4, "splitContainer4");
		this.splitContainer4.Name = "splitContainer4";
		this.splitContainer4.Panel1.Controls.Add(this.sGroupDataGridView);
		this.splitContainer4.Panel1.Controls.Add(this.sGroupBindingNavigator);
		this.splitContainer4.Panel2.Controls.Add(this.stockItemDataGridView);
		this.splitContainer4.Panel2.Controls.Add(this.stockItemBindingNavigator);
		this.sGroupDataGridView.AllowUserToAddRows = false;
		this.sGroupDataGridView.AutoGenerateColumns = false;
		this.sGroupDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.sGroupDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.sGroupDataGridView, "sGroupDataGridView");
		this.sGroupDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.sGroupDataGridView.Columns.AddRange(this.gIDDataGridViewTextBoxColumn2, this.nameDataGridViewTextBoxColumn2);
		this.sGroupDataGridView.DataSource = this.sGroupBindingSource;
		this.sGroupDataGridView.Name = "sGroupDataGridView";
		this.sGroupDataGridView.ReadOnly = true;
		this.sGroupDataGridView.RowTemplate.Height = 23;
		this.sGroupDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.sGroupDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(sGroupDataGridView_DataError);
		this.gIDDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.gIDDataGridViewTextBoxColumn2.DataPropertyName = "GID";
		this.gIDDataGridViewTextBoxColumn2.FillWeight = 25f;
		resources.ApplyResources(this.gIDDataGridViewTextBoxColumn2, "gIDDataGridViewTextBoxColumn2");
		this.gIDDataGridViewTextBoxColumn2.Name = "gIDDataGridViewTextBoxColumn2";
		this.gIDDataGridViewTextBoxColumn2.ReadOnly = true;
		this.nameDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.nameDataGridViewTextBoxColumn2.DataPropertyName = "Name";
		resources.ApplyResources(this.nameDataGridViewTextBoxColumn2, "nameDataGridViewTextBoxColumn2");
		this.nameDataGridViewTextBoxColumn2.Name = "nameDataGridViewTextBoxColumn2";
		this.nameDataGridViewTextBoxColumn2.ReadOnly = true;
		this.sGroupBindingSource.DataMember = "SGroup";
		this.sGroupBindingSource.DataSource = this.reportDataSet;
		this.sGroupBindingSource.Filter = "GID > 0";
		this.sGroupBindingSource.CurrentChanged += new System.EventHandler(sGroupBindingSource_CurrentChanged);
		this.sGroupBindingNavigator.AddNewItem = null;
		this.sGroupBindingNavigator.BindingSource = this.sGroupBindingSource;
		this.sGroupBindingNavigator.CountItem = this.bindingNavigatorCountItem5;
		this.sGroupBindingNavigator.DeleteItem = null;
		this.sGroupBindingNavigator.GripStyle = System.Windows.Forms.ToolStripGripStyle.Hidden;
		this.sGroupBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.bindingNavigatorMoveFirstItem5, this.bindingNavigatorMovePreviousItem5, this.bindingNavigatorSeparator15, this.bindingNavigatorPositionItem5, this.bindingNavigatorCountItem5, this.bindingNavigatorSeparator16, this.bindingNavigatorMoveNextItem5, this.bindingNavigatorMoveLastItem5, this.bindingNavigatorSeparator17, this.bindingNavigatorAddNewItem5,
			this.bindingNavigatorDeleteItem5
		});
		resources.ApplyResources(this.sGroupBindingNavigator, "sGroupBindingNavigator");
		this.sGroupBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem5;
		this.sGroupBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem5;
		this.sGroupBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem5;
		this.sGroupBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem5;
		this.sGroupBindingNavigator.Name = "sGroupBindingNavigator";
		this.sGroupBindingNavigator.PositionItem = this.bindingNavigatorPositionItem5;
		this.bindingNavigatorCountItem5.Name = "bindingNavigatorCountItem5";
		resources.ApplyResources(this.bindingNavigatorCountItem5, "bindingNavigatorCountItem5");
		this.bindingNavigatorMoveFirstItem5.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem5, "bindingNavigatorMoveFirstItem5");
		this.bindingNavigatorMoveFirstItem5.Name = "bindingNavigatorMoveFirstItem5";
		this.bindingNavigatorMovePreviousItem5.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem5, "bindingNavigatorMovePreviousItem5");
		this.bindingNavigatorMovePreviousItem5.Name = "bindingNavigatorMovePreviousItem5";
		this.bindingNavigatorSeparator15.Name = "bindingNavigatorSeparator15";
		resources.ApplyResources(this.bindingNavigatorSeparator15, "bindingNavigatorSeparator15");
		resources.ApplyResources(this.bindingNavigatorPositionItem5, "bindingNavigatorPositionItem5");
		this.bindingNavigatorPositionItem5.Name = "bindingNavigatorPositionItem5";
		this.bindingNavigatorSeparator16.Name = "bindingNavigatorSeparator16";
		resources.ApplyResources(this.bindingNavigatorSeparator16, "bindingNavigatorSeparator16");
		this.bindingNavigatorMoveNextItem5.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem5, "bindingNavigatorMoveNextItem5");
		this.bindingNavigatorMoveNextItem5.Name = "bindingNavigatorMoveNextItem5";
		this.bindingNavigatorMoveLastItem5.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem5, "bindingNavigatorMoveLastItem5");
		this.bindingNavigatorMoveLastItem5.Name = "bindingNavigatorMoveLastItem5";
		this.bindingNavigatorSeparator17.Name = "bindingNavigatorSeparator17";
		resources.ApplyResources(this.bindingNavigatorSeparator17, "bindingNavigatorSeparator17");
		this.bindingNavigatorAddNewItem5.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem5, "bindingNavigatorAddNewItem5");
		this.bindingNavigatorAddNewItem5.Name = "bindingNavigatorAddNewItem5";
		this.bindingNavigatorAddNewItem5.Click += new System.EventHandler(bindingNavigatorAddNewItem5_Click);
		this.bindingNavigatorDeleteItem5.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem5, "bindingNavigatorDeleteItem5");
		this.bindingNavigatorDeleteItem5.Name = "bindingNavigatorDeleteItem5";
		this.bindingNavigatorDeleteItem5.Click += new System.EventHandler(bindingNavigatorDeleteItem5_Click);
		this.stockItemDataGridView.AllowUserToAddRows = false;
		this.stockItemDataGridView.AllowUserToDeleteRows = false;
		this.stockItemDataGridView.AutoGenerateColumns = false;
		this.stockItemDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.stockItemDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.stockItemDataGridView, "stockItemDataGridView");
		this.stockItemDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.stockItemDataGridView.Columns.AddRange(this.mACDataGridViewTextBoxColumn2, this.fIDDataGridViewTextBoxColumn2, this.subIDDataGridViewTextBoxColumn2, this.TypeDataGridViewTextBoxColumn2, this.typeDataGridViewComboBoxColumn2, this.dateTimeDataGridViewTextBoxColumn2, this.pLUDataGridViewTextBoxColumn2, this.pLUDataGridViewComboBoxColumn2, this.unitPriceDataGridViewTextBoxColumn2, this.amountDataGridViewTextBoxColumn2, this.unitDataGridViewTextBoxColumn2, this.unitDataGridViewComboBoxColumn2, this.priceDataGridViewTextBoxColumn2);
		this.stockItemDataGridView.DataSource = this.stockItemBindingSource;
		this.stockItemDataGridView.Name = "stockItemDataGridView";
		this.stockItemDataGridView.ReadOnly = true;
		this.stockItemDataGridView.RowTemplate.Height = 23;
		this.stockItemDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(stockItemDataGridView_DataError);
		this.mACDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.mACDataGridViewTextBoxColumn2.DataPropertyName = "MAC";
		this.mACDataGridViewTextBoxColumn2.FillWeight = 40f;
		resources.ApplyResources(this.mACDataGridViewTextBoxColumn2, "mACDataGridViewTextBoxColumn2");
		this.mACDataGridViewTextBoxColumn2.Name = "mACDataGridViewTextBoxColumn2";
		this.mACDataGridViewTextBoxColumn2.ReadOnly = true;
		this.fIDDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.fIDDataGridViewTextBoxColumn2.DataPropertyName = "FID";
		this.fIDDataGridViewTextBoxColumn2.FillWeight = 25f;
		resources.ApplyResources(this.fIDDataGridViewTextBoxColumn2, "fIDDataGridViewTextBoxColumn2");
		this.fIDDataGridViewTextBoxColumn2.Name = "fIDDataGridViewTextBoxColumn2";
		this.fIDDataGridViewTextBoxColumn2.ReadOnly = true;
		this.subIDDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.subIDDataGridViewTextBoxColumn2.DataPropertyName = "SubID";
		this.subIDDataGridViewTextBoxColumn2.FillWeight = 25f;
		resources.ApplyResources(this.subIDDataGridViewTextBoxColumn2, "subIDDataGridViewTextBoxColumn2");
		this.subIDDataGridViewTextBoxColumn2.Name = "subIDDataGridViewTextBoxColumn2";
		this.subIDDataGridViewTextBoxColumn2.ReadOnly = true;
		this.TypeDataGridViewTextBoxColumn2.DataPropertyName = "Type";
		resources.ApplyResources(this.TypeDataGridViewTextBoxColumn2, "TypeDataGridViewTextBoxColumn2");
		this.TypeDataGridViewTextBoxColumn2.Name = "TypeDataGridViewTextBoxColumn2";
		this.TypeDataGridViewTextBoxColumn2.ReadOnly = true;
		this.typeDataGridViewComboBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.typeDataGridViewComboBoxColumn2.DataPropertyName = "Type";
		this.typeDataGridViewComboBoxColumn2.DataSource = this.stockTypeBindingSource;
		this.typeDataGridViewComboBoxColumn2.DisplayMember = "Name";
		this.typeDataGridViewComboBoxColumn2.FillWeight = 60f;
		resources.ApplyResources(this.typeDataGridViewComboBoxColumn2, "typeDataGridViewComboBoxColumn2");
		this.typeDataGridViewComboBoxColumn2.Name = "typeDataGridViewComboBoxColumn2";
		this.typeDataGridViewComboBoxColumn2.ReadOnly = true;
		this.typeDataGridViewComboBoxColumn2.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.typeDataGridViewComboBoxColumn2.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.typeDataGridViewComboBoxColumn2.ValueMember = "TypeID";
		this.stockTypeBindingSource.AllowNew = false;
		this.stockTypeBindingSource.DataMember = "rStockType";
		this.stockTypeBindingSource.DataSource = this.reportDataSet;
		this.dateTimeDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dateTimeDataGridViewTextBoxColumn2.DataPropertyName = "DateTime";
		this.dateTimeDataGridViewTextBoxColumn2.FillWeight = 45f;
		resources.ApplyResources(this.dateTimeDataGridViewTextBoxColumn2, "dateTimeDataGridViewTextBoxColumn2");
		this.dateTimeDataGridViewTextBoxColumn2.Name = "dateTimeDataGridViewTextBoxColumn2";
		this.dateTimeDataGridViewTextBoxColumn2.ReadOnly = true;
		this.pLUDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUDataGridViewTextBoxColumn2.DataPropertyName = "PLU";
		this.pLUDataGridViewTextBoxColumn2.FillWeight = 35f;
		resources.ApplyResources(this.pLUDataGridViewTextBoxColumn2, "pLUDataGridViewTextBoxColumn2");
		this.pLUDataGridViewTextBoxColumn2.Name = "pLUDataGridViewTextBoxColumn2";
		this.pLUDataGridViewTextBoxColumn2.ReadOnly = true;
		this.pLUDataGridViewComboBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUDataGridViewComboBoxColumn2.DataPropertyName = "PLU";
		this.pLUDataGridViewComboBoxColumn2.DataSource = this.pluBindingSource;
		this.pLUDataGridViewComboBoxColumn2.DisplayMember = "Name";
		this.pLUDataGridViewComboBoxColumn2.FillWeight = 70f;
		resources.ApplyResources(this.pLUDataGridViewComboBoxColumn2, "pLUDataGridViewComboBoxColumn2");
		this.pLUDataGridViewComboBoxColumn2.Name = "pLUDataGridViewComboBoxColumn2";
		this.pLUDataGridViewComboBoxColumn2.ReadOnly = true;
		this.pLUDataGridViewComboBoxColumn2.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.pLUDataGridViewComboBoxColumn2.ValueMember = "PLUID";
		this.unitPriceDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitPriceDataGridViewTextBoxColumn2.DataPropertyName = "UnitPrice";
		this.unitPriceDataGridViewTextBoxColumn2.FillWeight = 40f;
		resources.ApplyResources(this.unitPriceDataGridViewTextBoxColumn2, "unitPriceDataGridViewTextBoxColumn2");
		this.unitPriceDataGridViewTextBoxColumn2.Name = "unitPriceDataGridViewTextBoxColumn2";
		this.unitPriceDataGridViewTextBoxColumn2.ReadOnly = true;
		this.amountDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.amountDataGridViewTextBoxColumn2.DataPropertyName = "Amount";
		this.amountDataGridViewTextBoxColumn2.FillWeight = 35f;
		resources.ApplyResources(this.amountDataGridViewTextBoxColumn2, "amountDataGridViewTextBoxColumn2");
		this.amountDataGridViewTextBoxColumn2.Name = "amountDataGridViewTextBoxColumn2";
		this.amountDataGridViewTextBoxColumn2.ReadOnly = true;
		this.unitDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitDataGridViewTextBoxColumn2.DataPropertyName = "Unit";
		this.unitDataGridViewTextBoxColumn2.FillWeight = 35f;
		resources.ApplyResources(this.unitDataGridViewTextBoxColumn2, "unitDataGridViewTextBoxColumn2");
		this.unitDataGridViewTextBoxColumn2.Name = "unitDataGridViewTextBoxColumn2";
		this.unitDataGridViewTextBoxColumn2.ReadOnly = true;
		this.unitDataGridViewComboBoxColumn2.DataPropertyName = "Unit";
		this.unitDataGridViewComboBoxColumn2.DataSource = this.unitBindingSource;
		this.unitDataGridViewComboBoxColumn2.DisplayMember = "Pamount";
		resources.ApplyResources(this.unitDataGridViewComboBoxColumn2, "unitDataGridViewComboBoxColumn2");
		this.unitDataGridViewComboBoxColumn2.Name = "unitDataGridViewComboBoxColumn2";
		this.unitDataGridViewComboBoxColumn2.ReadOnly = true;
		this.unitDataGridViewComboBoxColumn2.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.unitDataGridViewComboBoxColumn2.ValueMember = "UnitID";
		this.priceDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.priceDataGridViewTextBoxColumn2.DataPropertyName = "Price";
		this.priceDataGridViewTextBoxColumn2.FillWeight = 35f;
		resources.ApplyResources(this.priceDataGridViewTextBoxColumn2, "priceDataGridViewTextBoxColumn2");
		this.priceDataGridViewTextBoxColumn2.Name = "priceDataGridViewTextBoxColumn2";
		this.priceDataGridViewTextBoxColumn2.ReadOnly = true;
		this.stockItemBindingSource.DataMember = "FK_SGroup_StockItem";
		this.stockItemBindingSource.DataSource = this.sGroupBindingSource;
		this.stockItemBindingSource.Sort = "DateTime";
		this.stockItemBindingNavigator.AddNewItem = null;
		this.stockItemBindingNavigator.BindingSource = this.stockItemBindingSource;
		this.stockItemBindingNavigator.CountItem = this.bindingNavigatorCountItem3;
		this.stockItemBindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem3;
		this.stockItemBindingNavigator.GripStyle = System.Windows.Forms.ToolStripGripStyle.Hidden;
		this.stockItemBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[15]
		{
			this.bindingNavigatorMoveFirstItem3, this.bindingNavigatorMovePreviousItem3, this.bindingNavigatorSeparator5, this.bindingNavigatorPositionItem3, this.bindingNavigatorCountItem3, this.bindingNavigatorSeparator9, this.bindingNavigatorMoveNextItem3, this.bindingNavigatorMoveLastItem3, this.bindingNavigatorSeparator10, this.bindingNavigatorAddNewItem3,
			this.bindingNavigatorDeleteItem3, this.stockItemSaveToolStripButton, this.stockItemSaveAllToolStripButton, this.bindingNavigatorFilter, this.FilterAdd_ToolStripButton
		});
		resources.ApplyResources(this.stockItemBindingNavigator, "stockItemBindingNavigator");
		this.stockItemBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem3;
		this.stockItemBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem3;
		this.stockItemBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem3;
		this.stockItemBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem3;
		this.stockItemBindingNavigator.Name = "stockItemBindingNavigator";
		this.stockItemBindingNavigator.PositionItem = this.bindingNavigatorPositionItem3;
		this.bindingNavigatorCountItem3.Name = "bindingNavigatorCountItem3";
		resources.ApplyResources(this.bindingNavigatorCountItem3, "bindingNavigatorCountItem3");
		this.bindingNavigatorDeleteItem3.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem3, "bindingNavigatorDeleteItem3");
		this.bindingNavigatorDeleteItem3.Name = "bindingNavigatorDeleteItem3";
		this.bindingNavigatorMoveFirstItem3.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem3, "bindingNavigatorMoveFirstItem3");
		this.bindingNavigatorMoveFirstItem3.Name = "bindingNavigatorMoveFirstItem3";
		this.bindingNavigatorMovePreviousItem3.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem3, "bindingNavigatorMovePreviousItem3");
		this.bindingNavigatorMovePreviousItem3.Name = "bindingNavigatorMovePreviousItem3";
		this.bindingNavigatorSeparator5.Name = "bindingNavigatorSeparator5";
		resources.ApplyResources(this.bindingNavigatorSeparator5, "bindingNavigatorSeparator5");
		resources.ApplyResources(this.bindingNavigatorPositionItem3, "bindingNavigatorPositionItem3");
		this.bindingNavigatorPositionItem3.Name = "bindingNavigatorPositionItem3";
		this.bindingNavigatorSeparator9.Name = "bindingNavigatorSeparator9";
		resources.ApplyResources(this.bindingNavigatorSeparator9, "bindingNavigatorSeparator9");
		this.bindingNavigatorMoveNextItem3.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem3, "bindingNavigatorMoveNextItem3");
		this.bindingNavigatorMoveNextItem3.Name = "bindingNavigatorMoveNextItem3";
		this.bindingNavigatorMoveLastItem3.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem3, "bindingNavigatorMoveLastItem3");
		this.bindingNavigatorMoveLastItem3.Name = "bindingNavigatorMoveLastItem3";
		this.bindingNavigatorSeparator10.Name = "bindingNavigatorSeparator10";
		resources.ApplyResources(this.bindingNavigatorSeparator10, "bindingNavigatorSeparator10");
		this.bindingNavigatorAddNewItem3.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem3, "bindingNavigatorAddNewItem3");
		this.bindingNavigatorAddNewItem3.Name = "bindingNavigatorAddNewItem3";
		this.bindingNavigatorAddNewItem3.Click += new System.EventHandler(bindingNavigatorAddNewItem3_Click);
		this.stockItemSaveToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.stockItemSaveToolStripButton.Image = ECS.Properties.Resources.barcodeBindingNavigatorSaveItem;
		resources.ApplyResources(this.stockItemSaveToolStripButton, "stockItemSaveToolStripButton");
		this.stockItemSaveToolStripButton.Name = "stockItemSaveToolStripButton";
		this.stockItemSaveToolStripButton.Click += new System.EventHandler(stockItemSaveToolStripButton_Click);
		this.stockItemSaveAllToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.stockItemSaveAllToolStripButton.Image = ECS.Properties.Resources.SaveAll;
		resources.ApplyResources(this.stockItemSaveAllToolStripButton, "stockItemSaveAllToolStripButton");
		this.stockItemSaveAllToolStripButton.Name = "stockItemSaveAllToolStripButton";
		this.stockItemSaveAllToolStripButton.Click += new System.EventHandler(stockItemSaveAllToolStripButton_Click);
		this.bindingNavigatorFilter.CheckOnClick = true;
		this.bindingNavigatorFilter.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorFilter.Image = ECS.Properties.Resources.bindingNavigatorFilter;
		resources.ApplyResources(this.bindingNavigatorFilter, "bindingNavigatorFilter");
		this.bindingNavigatorFilter.Name = "bindingNavigatorFilter";
		this.bindingNavigatorFilter.CheckedChanged += new System.EventHandler(bindingNavigatorFilter_CheckedChanged);
		this.FilterAdd_ToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.FilterAdd_ToolStripButton, "FilterAdd_ToolStripButton");
		this.FilterAdd_ToolStripButton.Name = "FilterAdd_ToolStripButton";
		this.FilterAdd_ToolStripButton.Click += new System.EventHandler(FilterAdd_ToolStripButton_Click);
		this.stockDataGridView.AllowUserToAddRows = false;
		this.stockDataGridView.AllowUserToDeleteRows = false;
		this.stockDataGridView.AutoGenerateColumns = false;
		this.stockDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.stockDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.stockDataGridView, "stockDataGridView");
		this.stockDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.stockDataGridView.Columns.AddRange(this.pLUDataGridViewTextBoxColumn2_1, this.pLUDataGridViewComboBoxColumn2_1, this.unitDataGridViewTextBoxColumn2_1, this.unitDataGridViewComboBoxColumn2_1, this.amountDataGridViewTextBoxColumn2_1, this.sTakingTimeDataGridViewTextBoxColumn2, this.spoilageDataGridViewTextBoxColumn2, this.inAmountDataGridViewTextBoxColumn2, this.amountSPDataGridViewTextBoxColumn2, this.unitSPDataGridViewTextBoxColumn2, this.unitSPDataGridViewComboBoxColumn2, this.spoilageSPDataGridViewTextBoxColumn2, this.inAmountSPDataGridViewTextBoxColumn2, this.inMoneyDataGridViewTextBoxColumn2, this.safetyStockDataGridViewTextBoxColumn2, this.lowStockDataGridViewCheckBoxColumn2, this.orderDataGridViewTextBoxColumn2);
		this.stockDataGridView.DataSource = this.stockBindingSource;
		this.stockDataGridView.Name = "stockDataGridView";
		this.stockDataGridView.RowTemplate.Height = 23;
		this.stockDataGridView.CellValueChanged += new System.Windows.Forms.DataGridViewCellEventHandler(stockDataGridView_CellValueChanged);
		this.stockDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(stockDataGridView_DataError);
		this.pLUDataGridViewTextBoxColumn2_1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUDataGridViewTextBoxColumn2_1.DataPropertyName = "PLU";
		this.pLUDataGridViewTextBoxColumn2_1.FillWeight = 40f;
		resources.ApplyResources(this.pLUDataGridViewTextBoxColumn2_1, "pLUDataGridViewTextBoxColumn2_1");
		this.pLUDataGridViewTextBoxColumn2_1.Name = "pLUDataGridViewTextBoxColumn2_1";
		this.pLUDataGridViewTextBoxColumn2_1.ReadOnly = true;
		this.pLUDataGridViewComboBoxColumn2_1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUDataGridViewComboBoxColumn2_1.DataPropertyName = "PLU";
		this.pLUDataGridViewComboBoxColumn2_1.DataSource = this.pluBindingSource;
		this.pLUDataGridViewComboBoxColumn2_1.DisplayMember = "Name";
		this.pLUDataGridViewComboBoxColumn2_1.FillWeight = 40f;
		resources.ApplyResources(this.pLUDataGridViewComboBoxColumn2_1, "pLUDataGridViewComboBoxColumn2_1");
		this.pLUDataGridViewComboBoxColumn2_1.Name = "pLUDataGridViewComboBoxColumn2_1";
		this.pLUDataGridViewComboBoxColumn2_1.ReadOnly = true;
		this.pLUDataGridViewComboBoxColumn2_1.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.pLUDataGridViewComboBoxColumn2_1.ValueMember = "PLUID";
		this.unitDataGridViewTextBoxColumn2_1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitDataGridViewTextBoxColumn2_1.DataPropertyName = "Unit";
		this.unitDataGridViewTextBoxColumn2_1.FillWeight = 40f;
		resources.ApplyResources(this.unitDataGridViewTextBoxColumn2_1, "unitDataGridViewTextBoxColumn2_1");
		this.unitDataGridViewTextBoxColumn2_1.Name = "unitDataGridViewTextBoxColumn2_1";
		this.unitDataGridViewTextBoxColumn2_1.ReadOnly = true;
		this.unitDataGridViewComboBoxColumn2_1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitDataGridViewComboBoxColumn2_1.DataPropertyName = "Unit";
		this.unitDataGridViewComboBoxColumn2_1.DataSource = this.unitBindingSource;
		this.unitDataGridViewComboBoxColumn2_1.DisplayMember = "Pamount";
		this.unitDataGridViewComboBoxColumn2_1.FillWeight = 40f;
		resources.ApplyResources(this.unitDataGridViewComboBoxColumn2_1, "unitDataGridViewComboBoxColumn2_1");
		this.unitDataGridViewComboBoxColumn2_1.Name = "unitDataGridViewComboBoxColumn2_1";
		this.unitDataGridViewComboBoxColumn2_1.ReadOnly = true;
		this.unitDataGridViewComboBoxColumn2_1.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.unitDataGridViewComboBoxColumn2_1.ValueMember = "UnitID";
		this.amountDataGridViewTextBoxColumn2_1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.amountDataGridViewTextBoxColumn2_1.DataPropertyName = "Amount";
		this.amountDataGridViewTextBoxColumn2_1.FillWeight = 40f;
		resources.ApplyResources(this.amountDataGridViewTextBoxColumn2_1, "amountDataGridViewTextBoxColumn2_1");
		this.amountDataGridViewTextBoxColumn2_1.Name = "amountDataGridViewTextBoxColumn2_1";
		this.amountDataGridViewTextBoxColumn2_1.ReadOnly = true;
		this.sTakingTimeDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.sTakingTimeDataGridViewTextBoxColumn2.DataPropertyName = "STakingTime";
		this.sTakingTimeDataGridViewTextBoxColumn2.FillWeight = 60f;
		resources.ApplyResources(this.sTakingTimeDataGridViewTextBoxColumn2, "sTakingTimeDataGridViewTextBoxColumn2");
		this.sTakingTimeDataGridViewTextBoxColumn2.Name = "sTakingTimeDataGridViewTextBoxColumn2";
		this.sTakingTimeDataGridViewTextBoxColumn2.ReadOnly = true;
		this.spoilageDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.spoilageDataGridViewTextBoxColumn2.DataPropertyName = "Spoilage";
		this.spoilageDataGridViewTextBoxColumn2.FillWeight = 40f;
		resources.ApplyResources(this.spoilageDataGridViewTextBoxColumn2, "spoilageDataGridViewTextBoxColumn2");
		this.spoilageDataGridViewTextBoxColumn2.Name = "spoilageDataGridViewTextBoxColumn2";
		this.spoilageDataGridViewTextBoxColumn2.ReadOnly = true;
		this.inAmountDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.inAmountDataGridViewTextBoxColumn2.DataPropertyName = "In_Amount";
		this.inAmountDataGridViewTextBoxColumn2.FillWeight = 40f;
		resources.ApplyResources(this.inAmountDataGridViewTextBoxColumn2, "inAmountDataGridViewTextBoxColumn2");
		this.inAmountDataGridViewTextBoxColumn2.Name = "inAmountDataGridViewTextBoxColumn2";
		this.inAmountDataGridViewTextBoxColumn2.ReadOnly = true;
		this.amountSPDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.amountSPDataGridViewTextBoxColumn2.DataPropertyName = "AmountSP";
		this.amountSPDataGridViewTextBoxColumn2.FillWeight = 40f;
		resources.ApplyResources(this.amountSPDataGridViewTextBoxColumn2, "amountSPDataGridViewTextBoxColumn2");
		this.amountSPDataGridViewTextBoxColumn2.Name = "amountSPDataGridViewTextBoxColumn2";
		this.amountSPDataGridViewTextBoxColumn2.ReadOnly = true;
		this.unitSPDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitSPDataGridViewTextBoxColumn2.DataPropertyName = "UnitSP";
		this.unitSPDataGridViewTextBoxColumn2.FillWeight = 40f;
		resources.ApplyResources(this.unitSPDataGridViewTextBoxColumn2, "unitSPDataGridViewTextBoxColumn2");
		this.unitSPDataGridViewTextBoxColumn2.Name = "unitSPDataGridViewTextBoxColumn2";
		this.unitSPDataGridViewTextBoxColumn2.ReadOnly = true;
		this.unitSPDataGridViewComboBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitSPDataGridViewComboBoxColumn2.DataPropertyName = "UnitSP";
		this.unitSPDataGridViewComboBoxColumn2.DataSource = this.unitBindingSource;
		this.unitSPDataGridViewComboBoxColumn2.DisplayMember = "Pamount";
		this.unitSPDataGridViewComboBoxColumn2.FillWeight = 40f;
		resources.ApplyResources(this.unitSPDataGridViewComboBoxColumn2, "unitSPDataGridViewComboBoxColumn2");
		this.unitSPDataGridViewComboBoxColumn2.Name = "unitSPDataGridViewComboBoxColumn2";
		this.unitSPDataGridViewComboBoxColumn2.ReadOnly = true;
		this.unitSPDataGridViewComboBoxColumn2.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.unitSPDataGridViewComboBoxColumn2.ValueMember = "UnitID";
		this.spoilageSPDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.spoilageSPDataGridViewTextBoxColumn2.DataPropertyName = "SpoilageSP";
		this.spoilageSPDataGridViewTextBoxColumn2.FillWeight = 40f;
		resources.ApplyResources(this.spoilageSPDataGridViewTextBoxColumn2, "spoilageSPDataGridViewTextBoxColumn2");
		this.spoilageSPDataGridViewTextBoxColumn2.Name = "spoilageSPDataGridViewTextBoxColumn2";
		this.spoilageSPDataGridViewTextBoxColumn2.ReadOnly = true;
		this.inAmountSPDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.inAmountSPDataGridViewTextBoxColumn2.DataPropertyName = "In_AmountSP";
		this.inAmountSPDataGridViewTextBoxColumn2.FillWeight = 40f;
		resources.ApplyResources(this.inAmountSPDataGridViewTextBoxColumn2, "inAmountSPDataGridViewTextBoxColumn2");
		this.inAmountSPDataGridViewTextBoxColumn2.Name = "inAmountSPDataGridViewTextBoxColumn2";
		this.inAmountSPDataGridViewTextBoxColumn2.ReadOnly = true;
		this.inMoneyDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.inMoneyDataGridViewTextBoxColumn2.DataPropertyName = "In_Money";
		this.inMoneyDataGridViewTextBoxColumn2.FillWeight = 40f;
		resources.ApplyResources(this.inMoneyDataGridViewTextBoxColumn2, "inMoneyDataGridViewTextBoxColumn2");
		this.inMoneyDataGridViewTextBoxColumn2.Name = "inMoneyDataGridViewTextBoxColumn2";
		this.inMoneyDataGridViewTextBoxColumn2.ReadOnly = true;
		this.safetyStockDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.safetyStockDataGridViewTextBoxColumn2.DataPropertyName = "SafetyStock";
		this.safetyStockDataGridViewTextBoxColumn2.FillWeight = 40f;
		resources.ApplyResources(this.safetyStockDataGridViewTextBoxColumn2, "safetyStockDataGridViewTextBoxColumn2");
		this.safetyStockDataGridViewTextBoxColumn2.Name = "safetyStockDataGridViewTextBoxColumn2";
		this.lowStockDataGridViewCheckBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.lowStockDataGridViewCheckBoxColumn2.DataPropertyName = "LowStock";
		this.lowStockDataGridViewCheckBoxColumn2.FillWeight = 30f;
		resources.ApplyResources(this.lowStockDataGridViewCheckBoxColumn2, "lowStockDataGridViewCheckBoxColumn2");
		this.lowStockDataGridViewCheckBoxColumn2.Name = "lowStockDataGridViewCheckBoxColumn2";
		this.lowStockDataGridViewCheckBoxColumn2.ReadOnly = true;
		this.lowStockDataGridViewCheckBoxColumn2.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.orderDataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.orderDataGridViewTextBoxColumn2.DataPropertyName = "Order";
		this.orderDataGridViewTextBoxColumn2.FillWeight = 40f;
		resources.ApplyResources(this.orderDataGridViewTextBoxColumn2, "orderDataGridViewTextBoxColumn2");
		this.orderDataGridViewTextBoxColumn2.Name = "orderDataGridViewTextBoxColumn2";
		this.stockBindingSource.DataMember = "FK_SGroup_Stock";
		this.stockBindingSource.DataSource = this.sGroupBindingSource;
		this.stockBindingSource.Sort = "PLU";
		this.stockBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem4;
		this.stockBindingNavigator.BindingSource = this.stockBindingSource;
		this.stockBindingNavigator.CountItem = this.bindingNavigatorCountItem4;
		this.stockBindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem4;
		this.stockBindingNavigator.GripStyle = System.Windows.Forms.ToolStripGripStyle.Hidden;
		this.stockBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[20]
		{
			this.bindingNavigatorMoveFirstItem4, this.bindingNavigatorMovePreviousItem4, this.bindingNavigatorSeparator11, this.bindingNavigatorPositionItem4, this.bindingNavigatorCountItem4, this.bindingNavigatorSeparator12, this.bindingNavigatorMoveNextItem4, this.bindingNavigatorMoveLastItem4, this.bindingNavigatorSeparator13, this.editStock_ToolStripButton,
			this.ExcelSCV_ToolStripButton, this.toolStripSeparator1, this.bindingNavigatorAddNewItem4, this.bindingNavigatorDeleteItem4, this.clearSpoilage_ToolStripButton, this.clearIn_ToolStripButton, this.clearOrder_ToolStripButton, this.clearSP_ToolStripButton, this.stockSaveToolStripButton, this.stockSaveAllToolStripButton
		});
		resources.ApplyResources(this.stockBindingNavigator, "stockBindingNavigator");
		this.stockBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem4;
		this.stockBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem4;
		this.stockBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem4;
		this.stockBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem4;
		this.stockBindingNavigator.Name = "stockBindingNavigator";
		this.stockBindingNavigator.PositionItem = this.bindingNavigatorPositionItem4;
		this.bindingNavigatorAddNewItem4.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem4, "bindingNavigatorAddNewItem4");
		this.bindingNavigatorAddNewItem4.Name = "bindingNavigatorAddNewItem4";
		this.bindingNavigatorCountItem4.Name = "bindingNavigatorCountItem4";
		resources.ApplyResources(this.bindingNavigatorCountItem4, "bindingNavigatorCountItem4");
		this.bindingNavigatorDeleteItem4.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem4, "bindingNavigatorDeleteItem4");
		this.bindingNavigatorDeleteItem4.Name = "bindingNavigatorDeleteItem4";
		this.bindingNavigatorMoveFirstItem4.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem4, "bindingNavigatorMoveFirstItem4");
		this.bindingNavigatorMoveFirstItem4.Name = "bindingNavigatorMoveFirstItem4";
		this.bindingNavigatorMovePreviousItem4.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem4, "bindingNavigatorMovePreviousItem4");
		this.bindingNavigatorMovePreviousItem4.Name = "bindingNavigatorMovePreviousItem4";
		this.bindingNavigatorSeparator11.Name = "bindingNavigatorSeparator11";
		resources.ApplyResources(this.bindingNavigatorSeparator11, "bindingNavigatorSeparator11");
		resources.ApplyResources(this.bindingNavigatorPositionItem4, "bindingNavigatorPositionItem4");
		this.bindingNavigatorPositionItem4.Name = "bindingNavigatorPositionItem4";
		this.bindingNavigatorSeparator12.Name = "bindingNavigatorSeparator12";
		resources.ApplyResources(this.bindingNavigatorSeparator12, "bindingNavigatorSeparator12");
		this.bindingNavigatorMoveNextItem4.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem4, "bindingNavigatorMoveNextItem4");
		this.bindingNavigatorMoveNextItem4.Name = "bindingNavigatorMoveNextItem4";
		this.bindingNavigatorMoveLastItem4.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem4, "bindingNavigatorMoveLastItem4");
		this.bindingNavigatorMoveLastItem4.Name = "bindingNavigatorMoveLastItem4";
		this.bindingNavigatorSeparator13.Name = "bindingNavigatorSeparator13";
		resources.ApplyResources(this.bindingNavigatorSeparator13, "bindingNavigatorSeparator13");
		this.editStock_ToolStripButton.Image = ECS.Properties.Resources.Edit;
		resources.ApplyResources(this.editStock_ToolStripButton, "editStock_ToolStripButton");
		this.editStock_ToolStripButton.Name = "editStock_ToolStripButton";
		this.editStock_ToolStripButton.Click += new System.EventHandler(editStock_ToolStripButton_Click);
		this.ExcelSCV_ToolStripButton.Image = ECS.Properties.Resources.Table;
		resources.ApplyResources(this.ExcelSCV_ToolStripButton, "ExcelSCV_ToolStripButton");
		this.ExcelSCV_ToolStripButton.Name = "ExcelSCV_ToolStripButton";
		this.ExcelSCV_ToolStripButton.Click += new System.EventHandler(ExcelSCV_ToolStripButton_Click);
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		this.clearSpoilage_ToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.clearSpoilage_ToolStripButton.Image = ECS.Properties.Resources.NewM;
		resources.ApplyResources(this.clearSpoilage_ToolStripButton, "clearSpoilage_ToolStripButton");
		this.clearSpoilage_ToolStripButton.Name = "clearSpoilage_ToolStripButton";
		this.clearSpoilage_ToolStripButton.Click += new System.EventHandler(clearSpoilage_ToolStripButton_Click);
		this.clearIn_ToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.clearIn_ToolStripButton.Image = ECS.Properties.Resources.NewP;
		resources.ApplyResources(this.clearIn_ToolStripButton, "clearIn_ToolStripButton");
		this.clearIn_ToolStripButton.Name = "clearIn_ToolStripButton";
		this.clearIn_ToolStripButton.Click += new System.EventHandler(clearIn_ToolStripButton_Click);
		this.clearOrder_ToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.clearOrder_ToolStripButton, "clearOrder_ToolStripButton");
		this.clearOrder_ToolStripButton.Name = "clearOrder_ToolStripButton";
		this.clearOrder_ToolStripButton.Click += new System.EventHandler(clearOrder_ToolStripButton_Click);
		this.clearSP_ToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.clearSP_ToolStripButton, "clearSP_ToolStripButton");
		this.clearSP_ToolStripButton.Name = "clearSP_ToolStripButton";
		this.clearSP_ToolStripButton.Click += new System.EventHandler(clearSP_ToolStripButton_Click);
		this.stockSaveToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.stockSaveToolStripButton.Image = ECS.Properties.Resources.barcodeBindingNavigatorSaveItem;
		resources.ApplyResources(this.stockSaveToolStripButton, "stockSaveToolStripButton");
		this.stockSaveToolStripButton.Name = "stockSaveToolStripButton";
		this.stockSaveToolStripButton.Click += new System.EventHandler(stockSaveToolStripButton_Click);
		this.stockSaveAllToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.stockSaveAllToolStripButton.Image = ECS.Properties.Resources.SaveAll;
		resources.ApplyResources(this.stockSaveAllToolStripButton, "stockSaveAllToolStripButton");
		this.stockSaveAllToolStripButton.Name = "stockSaveAllToolStripButton";
		this.stockSaveAllToolStripButton.Click += new System.EventHandler(stockSaveAllToolStripButton_Click);
		this.pluTableAdapter.ClearBeforeFill = true;
		this.serialPort.BaudRate = ECS.Properties.Settings.Default.serailBaudRate;
		this.serialPort.DataBits = ECS.Properties.Settings.Default.serialDataBits;
		this.serialPort.Handshake = ECS.Properties.Settings.Default.serialHandShake;
		this.serialPort.Parity = ECS.Properties.Settings.Default.serialParity;
		this.serialPort.ReadTimeout = ECS.Properties.Settings.Default.recvTimeOut;
		this.serialPort.StopBits = ECS.Properties.Settings.Default.serialStopBits;
		this.serialPort.WriteTimeout = ECS.Properties.Settings.Default.recvTimeOut;
		this.stringTableAdapter.ClearBeforeFill = true;
		this.Main_TabControl.Controls.Add(this.Sale_TabPage);
		this.Main_TabControl.Controls.Add(this.Analysis_TabPage);
		this.Main_TabControl.Controls.Add(this.Stock_TabPage);
		resources.ApplyResources(this.Main_TabControl, "Main_TabControl");
		this.Main_TabControl.Name = "Main_TabControl";
		this.Main_TabControl.SelectedIndex = 0;
		this.Main_TabControl.SelectedIndexChanged += new System.EventHandler(Main_TabControl_SelectedIndexChanged);
		this.Sale_TabPage.Controls.Add(this.Sale_TabControl);
		resources.ApplyResources(this.Sale_TabPage, "Sale_TabPage");
		this.Sale_TabPage.Name = "Sale_TabPage";
		this.Sale_TabPage.UseVisualStyleBackColor = true;
		this.Sale_TabControl.Controls.Add(this.Data_TabPage);
		this.Sale_TabControl.Controls.Add(this.DataImport_TabPage);
		resources.ApplyResources(this.Sale_TabControl, "Sale_TabControl");
		this.Sale_TabControl.Multiline = true;
		this.Sale_TabControl.Name = "Sale_TabControl";
		this.Sale_TabControl.SelectedIndex = 0;
		this.Data_TabPage.Controls.Add(this.Data_SplitContainer);
		resources.ApplyResources(this.Data_TabPage, "Data_TabPage");
		this.Data_TabPage.Name = "Data_TabPage";
		this.Data_TabPage.UseVisualStyleBackColor = true;
		this.DataImport_TabPage.AllowDrop = true;
		this.DataImport_TabPage.Controls.Add(this.splitContainer6);
		resources.ApplyResources(this.DataImport_TabPage, "DataImport_TabPage");
		this.DataImport_TabPage.Name = "DataImport_TabPage";
		this.DataImport_TabPage.UseVisualStyleBackColor = true;
		this.DataImport_TabPage.DragDrop += new System.Windows.Forms.DragEventHandler(DataImport_TabPage_DragDrop);
		this.DataImport_TabPage.DragEnter += new System.Windows.Forms.DragEventHandler(DataImport_TabPage_DragEnter);
		this.Analysis_TabPage.Controls.Add(this.Analysis_SplitContainer);
		resources.ApplyResources(this.Analysis_TabPage, "Analysis_TabPage");
		this.Analysis_TabPage.Name = "Analysis_TabPage";
		this.Analysis_TabPage.UseVisualStyleBackColor = true;
		this.Stock_TabPage.Controls.Add(this.splitContainer2);
		resources.ApplyResources(this.Stock_TabPage, "Stock_TabPage");
		this.Stock_TabPage.Name = "Stock_TabPage";
		this.Stock_TabPage.UseVisualStyleBackColor = true;
		this.printDialog1.UseEXDialog = true;
		resources.ApplyResources(this.MF_SplitContainer, "MF_SplitContainer");
		this.MF_SplitContainer.Name = "MF_SplitContainer";
		this.MF_SplitContainer.Panel1.Controls.Add(this.Main_TabControl);
		this.MF_SplitContainer.Panel1.Controls.Add(this.shrink_ToolStrip);
		this.MF_SplitContainer.Panel2.Controls.Add(this.MF_D_SplitContainer);
		this.shrink_ToolStrip.BackColor = System.Drawing.Color.FromArgb(255, 255, 128);
		this.shrink_ToolStrip.GripStyle = System.Windows.Forms.ToolStripGripStyle.Hidden;
		this.shrink_ToolStrip.Items.AddRange(new System.Windows.Forms.ToolStripItem[2] { this.shrink_R_ToolStripButton, this.report_ToolStripLabel });
		resources.ApplyResources(this.shrink_ToolStrip, "shrink_ToolStrip");
		this.shrink_ToolStrip.Name = "shrink_ToolStrip";
		this.shrink_R_ToolStripButton.Alignment = System.Windows.Forms.ToolStripItemAlignment.Right;
		this.shrink_R_ToolStripButton.Image = ECS.Properties.Resources.Shrink;
		resources.ApplyResources(this.shrink_R_ToolStripButton, "shrink_R_ToolStripButton");
		this.shrink_R_ToolStripButton.Name = "shrink_R_ToolStripButton";
		this.shrink_R_ToolStripButton.Click += new System.EventHandler(shrink_Click);
		this.report_ToolStripLabel.Name = "report_ToolStripLabel";
		resources.ApplyResources(this.report_ToolStripLabel, "report_ToolStripLabel");
		resources.ApplyResources(this.MF_D_SplitContainer, "MF_D_SplitContainer");
		this.MF_D_SplitContainer.Name = "MF_D_SplitContainer";
		this.MF_D_SplitContainer.Panel1.Controls.Add(this.allLog_DataGridView);
		this.MF_D_SplitContainer.Panel1.Controls.Add(this.MFD_L_BindingNavigator);
		this.MF_D_SplitContainer.Panel1.Controls.Add(this.MFD_L_ToolStrip);
		this.MF_D_SplitContainer.Panel2.Controls.Add(this.allStock_DataGridView);
		this.MF_D_SplitContainer.Panel2.Controls.Add(this.MFD_R_BindingNavigator);
		this.MF_D_SplitContainer.Panel2.Controls.Add(this.MFD_R_ToolStrip);
		this.allLog_DataGridView.AllowUserToAddRows = false;
		this.allLog_DataGridView.AllowUserToDeleteRows = false;
		this.allLog_DataGridView.AutoGenerateColumns = false;
		this.allLog_DataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.allLog_DataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.allLog_DataGridView, "allLog_DataGridView");
		this.allLog_DataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.allLog_DataGridView.Columns.AddRange(this.mACDataGridViewTextBoxColumn3, this.nameDataGridViewTextBoxColumn3, this.fIDDataGridViewTextBoxColumn3, this.dateTimeDataGridViewTextBoxColumn3, this.sIDDataGridViewTextBoxColumn3, this.salesmanDataGridViewTextBoxColumn3, this.subIDDataGridViewTextBoxColumn3, this.typeDataGridViewTextBoxColumn3, this.typeDataGridViewComboBoxColumn3, this.pLUDataGridViewTextBoxColumn3, this.pLUDataGridViewComboBoxColumn3, this.unitDataGridViewTextBoxColumn3, this.unitDataGridViewComboBoxColumn3, this.amountDataGridViewTextBoxColumn3, this.unitPriceDataGridViewTextBoxColumn3, this.priceDataGridViewTextBoxColumn3, this.costDataGridViewTextBoxColumn3, this.taxDataGridViewTextBoxColumn3, this.classDataGridViewTextBoxColumn3, this.deptDataGridViewTextBoxColumn3, this.text1DataGridViewTextBoxColumn3, this.text2DataGridViewTextBoxColumn3, this.text3DataGridViewTextBoxColumn3, this.text4DataGridViewTextBoxColumn3, this.coFIDDataGridViewTextBoxColumn3);
		this.allLog_DataGridView.DataSource = this.allLogsbindingSource;
		this.allLog_DataGridView.Name = "allLog_DataGridView";
		this.allLog_DataGridView.ReadOnly = true;
		this.allLog_DataGridView.RowTemplate.Height = 23;
		this.allLog_DataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(allLogItem_DataGridView_DataError);
		this.mACDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.mACDataGridViewTextBoxColumn3.DataPropertyName = "MAC";
		this.mACDataGridViewTextBoxColumn3.FillWeight = 80f;
		resources.ApplyResources(this.mACDataGridViewTextBoxColumn3, "mACDataGridViewTextBoxColumn3");
		this.mACDataGridViewTextBoxColumn3.Name = "mACDataGridViewTextBoxColumn3";
		this.mACDataGridViewTextBoxColumn3.ReadOnly = true;
		this.nameDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.nameDataGridViewTextBoxColumn3.DataPropertyName = "Name";
		resources.ApplyResources(this.nameDataGridViewTextBoxColumn3, "nameDataGridViewTextBoxColumn3");
		this.nameDataGridViewTextBoxColumn3.Name = "nameDataGridViewTextBoxColumn3";
		this.nameDataGridViewTextBoxColumn3.ReadOnly = true;
		this.fIDDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.fIDDataGridViewTextBoxColumn3.DataPropertyName = "FID";
		this.fIDDataGridViewTextBoxColumn3.FillWeight = 40f;
		resources.ApplyResources(this.fIDDataGridViewTextBoxColumn3, "fIDDataGridViewTextBoxColumn3");
		this.fIDDataGridViewTextBoxColumn3.Name = "fIDDataGridViewTextBoxColumn3";
		this.fIDDataGridViewTextBoxColumn3.ReadOnly = true;
		this.dateTimeDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dateTimeDataGridViewTextBoxColumn3.DataPropertyName = "DateTime";
		resources.ApplyResources(this.dateTimeDataGridViewTextBoxColumn3, "dateTimeDataGridViewTextBoxColumn3");
		this.dateTimeDataGridViewTextBoxColumn3.Name = "dateTimeDataGridViewTextBoxColumn3";
		this.dateTimeDataGridViewTextBoxColumn3.ReadOnly = true;
		this.sIDDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.sIDDataGridViewTextBoxColumn3.DataPropertyName = "SID";
		this.sIDDataGridViewTextBoxColumn3.FillWeight = 40f;
		resources.ApplyResources(this.sIDDataGridViewTextBoxColumn3, "sIDDataGridViewTextBoxColumn3");
		this.sIDDataGridViewTextBoxColumn3.Name = "sIDDataGridViewTextBoxColumn3";
		this.sIDDataGridViewTextBoxColumn3.ReadOnly = true;
		this.salesmanDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.salesmanDataGridViewTextBoxColumn3.DataPropertyName = "Salesman";
		this.salesmanDataGridViewTextBoxColumn3.FillWeight = 40f;
		resources.ApplyResources(this.salesmanDataGridViewTextBoxColumn3, "salesmanDataGridViewTextBoxColumn3");
		this.salesmanDataGridViewTextBoxColumn3.Name = "salesmanDataGridViewTextBoxColumn3";
		this.salesmanDataGridViewTextBoxColumn3.ReadOnly = true;
		this.subIDDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.subIDDataGridViewTextBoxColumn3.DataPropertyName = "SubID";
		this.subIDDataGridViewTextBoxColumn3.FillWeight = 40f;
		resources.ApplyResources(this.subIDDataGridViewTextBoxColumn3, "subIDDataGridViewTextBoxColumn3");
		this.subIDDataGridViewTextBoxColumn3.Name = "subIDDataGridViewTextBoxColumn3";
		this.subIDDataGridViewTextBoxColumn3.ReadOnly = true;
		this.typeDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.typeDataGridViewTextBoxColumn3.DataPropertyName = "Type";
		this.typeDataGridViewTextBoxColumn3.FillWeight = 30f;
		resources.ApplyResources(this.typeDataGridViewTextBoxColumn3, "typeDataGridViewTextBoxColumn3");
		this.typeDataGridViewTextBoxColumn3.Name = "typeDataGridViewTextBoxColumn3";
		this.typeDataGridViewTextBoxColumn3.ReadOnly = true;
		this.typeDataGridViewComboBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.typeDataGridViewComboBoxColumn3.DataPropertyName = "TypeName";
		this.typeDataGridViewComboBoxColumn3.FillWeight = 80f;
		resources.ApplyResources(this.typeDataGridViewComboBoxColumn3, "typeDataGridViewComboBoxColumn3");
		this.typeDataGridViewComboBoxColumn3.Name = "typeDataGridViewComboBoxColumn3";
		this.typeDataGridViewComboBoxColumn3.ReadOnly = true;
		this.pLUDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUDataGridViewTextBoxColumn3.DataPropertyName = "PLU";
		this.pLUDataGridViewTextBoxColumn3.FillWeight = 50f;
		resources.ApplyResources(this.pLUDataGridViewTextBoxColumn3, "pLUDataGridViewTextBoxColumn3");
		this.pLUDataGridViewTextBoxColumn3.Name = "pLUDataGridViewTextBoxColumn3";
		this.pLUDataGridViewTextBoxColumn3.ReadOnly = true;
		this.pLUDataGridViewComboBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUDataGridViewComboBoxColumn3.DataPropertyName = "PLUName";
		resources.ApplyResources(this.pLUDataGridViewComboBoxColumn3, "pLUDataGridViewComboBoxColumn3");
		this.pLUDataGridViewComboBoxColumn3.Name = "pLUDataGridViewComboBoxColumn3";
		this.pLUDataGridViewComboBoxColumn3.ReadOnly = true;
		this.unitDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitDataGridViewTextBoxColumn3.DataPropertyName = "Unit";
		this.unitDataGridViewTextBoxColumn3.FillWeight = 30f;
		resources.ApplyResources(this.unitDataGridViewTextBoxColumn3, "unitDataGridViewTextBoxColumn3");
		this.unitDataGridViewTextBoxColumn3.Name = "unitDataGridViewTextBoxColumn3";
		this.unitDataGridViewTextBoxColumn3.ReadOnly = true;
		this.unitDataGridViewComboBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitDataGridViewComboBoxColumn3.DataPropertyName = "UnitName";
		this.unitDataGridViewComboBoxColumn3.FillWeight = 50f;
		resources.ApplyResources(this.unitDataGridViewComboBoxColumn3, "unitDataGridViewComboBoxColumn3");
		this.unitDataGridViewComboBoxColumn3.Name = "unitDataGridViewComboBoxColumn3";
		this.unitDataGridViewComboBoxColumn3.ReadOnly = true;
		this.amountDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.amountDataGridViewTextBoxColumn3.DataPropertyName = "Amount";
		this.amountDataGridViewTextBoxColumn3.FillWeight = 50f;
		resources.ApplyResources(this.amountDataGridViewTextBoxColumn3, "amountDataGridViewTextBoxColumn3");
		this.amountDataGridViewTextBoxColumn3.Name = "amountDataGridViewTextBoxColumn3";
		this.amountDataGridViewTextBoxColumn3.ReadOnly = true;
		this.unitPriceDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitPriceDataGridViewTextBoxColumn3.DataPropertyName = "UnitPrice";
		this.unitPriceDataGridViewTextBoxColumn3.FillWeight = 50f;
		resources.ApplyResources(this.unitPriceDataGridViewTextBoxColumn3, "unitPriceDataGridViewTextBoxColumn3");
		this.unitPriceDataGridViewTextBoxColumn3.Name = "unitPriceDataGridViewTextBoxColumn3";
		this.unitPriceDataGridViewTextBoxColumn3.ReadOnly = true;
		this.priceDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.priceDataGridViewTextBoxColumn3.DataPropertyName = "Price";
		this.priceDataGridViewTextBoxColumn3.FillWeight = 50f;
		resources.ApplyResources(this.priceDataGridViewTextBoxColumn3, "priceDataGridViewTextBoxColumn3");
		this.priceDataGridViewTextBoxColumn3.Name = "priceDataGridViewTextBoxColumn3";
		this.priceDataGridViewTextBoxColumn3.ReadOnly = true;
		this.costDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.costDataGridViewTextBoxColumn3.DataPropertyName = "Cost";
		this.costDataGridViewTextBoxColumn3.FillWeight = 50f;
		resources.ApplyResources(this.costDataGridViewTextBoxColumn3, "costDataGridViewTextBoxColumn3");
		this.costDataGridViewTextBoxColumn3.Name = "costDataGridViewTextBoxColumn3";
		this.costDataGridViewTextBoxColumn3.ReadOnly = true;
		this.taxDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.taxDataGridViewTextBoxColumn3.DataPropertyName = "Tax";
		this.taxDataGridViewTextBoxColumn3.FillWeight = 50f;
		resources.ApplyResources(this.taxDataGridViewTextBoxColumn3, "taxDataGridViewTextBoxColumn3");
		this.taxDataGridViewTextBoxColumn3.Name = "taxDataGridViewTextBoxColumn3";
		this.taxDataGridViewTextBoxColumn3.ReadOnly = true;
		this.classDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.classDataGridViewTextBoxColumn3.DataPropertyName = "Class";
		this.classDataGridViewTextBoxColumn3.FillWeight = 40f;
		resources.ApplyResources(this.classDataGridViewTextBoxColumn3, "classDataGridViewTextBoxColumn3");
		this.classDataGridViewTextBoxColumn3.Name = "classDataGridViewTextBoxColumn3";
		this.classDataGridViewTextBoxColumn3.ReadOnly = true;
		this.deptDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.deptDataGridViewTextBoxColumn3.DataPropertyName = "Dept";
		this.deptDataGridViewTextBoxColumn3.FillWeight = 40f;
		resources.ApplyResources(this.deptDataGridViewTextBoxColumn3, "deptDataGridViewTextBoxColumn3");
		this.deptDataGridViewTextBoxColumn3.Name = "deptDataGridViewTextBoxColumn3";
		this.deptDataGridViewTextBoxColumn3.ReadOnly = true;
		this.text1DataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.text1DataGridViewTextBoxColumn3.DataPropertyName = "Text1";
		this.text1DataGridViewTextBoxColumn3.FillWeight = 60f;
		resources.ApplyResources(this.text1DataGridViewTextBoxColumn3, "text1DataGridViewTextBoxColumn3");
		this.text1DataGridViewTextBoxColumn3.Name = "text1DataGridViewTextBoxColumn3";
		this.text1DataGridViewTextBoxColumn3.ReadOnly = true;
		this.text2DataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.text2DataGridViewTextBoxColumn3.DataPropertyName = "Text2";
		this.text2DataGridViewTextBoxColumn3.FillWeight = 60f;
		resources.ApplyResources(this.text2DataGridViewTextBoxColumn3, "text2DataGridViewTextBoxColumn3");
		this.text2DataGridViewTextBoxColumn3.Name = "text2DataGridViewTextBoxColumn3";
		this.text2DataGridViewTextBoxColumn3.ReadOnly = true;
		this.text3DataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.text3DataGridViewTextBoxColumn3.DataPropertyName = "Text3";
		this.text3DataGridViewTextBoxColumn3.FillWeight = 60f;
		resources.ApplyResources(this.text3DataGridViewTextBoxColumn3, "text3DataGridViewTextBoxColumn3");
		this.text3DataGridViewTextBoxColumn3.Name = "text3DataGridViewTextBoxColumn3";
		this.text3DataGridViewTextBoxColumn3.ReadOnly = true;
		this.text4DataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.text4DataGridViewTextBoxColumn3.DataPropertyName = "Text4";
		this.text4DataGridViewTextBoxColumn3.FillWeight = 60f;
		resources.ApplyResources(this.text4DataGridViewTextBoxColumn3, "text4DataGridViewTextBoxColumn3");
		this.text4DataGridViewTextBoxColumn3.Name = "text4DataGridViewTextBoxColumn3";
		this.text4DataGridViewTextBoxColumn3.ReadOnly = true;
		this.coFIDDataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.coFIDDataGridViewTextBoxColumn3.DataPropertyName = "CoFID";
		this.coFIDDataGridViewTextBoxColumn3.FillWeight = 50f;
		resources.ApplyResources(this.coFIDDataGridViewTextBoxColumn3, "coFIDDataGridViewTextBoxColumn3");
		this.coFIDDataGridViewTextBoxColumn3.Name = "coFIDDataGridViewTextBoxColumn3";
		this.coFIDDataGridViewTextBoxColumn3.ReadOnly = true;
		this.allLogsbindingSource.AllowNew = false;
		this.allLogsbindingSource.DataMember = "AllLogs";
		this.allLogsbindingSource.DataSource = this.reportDataSet;
		this.allLogsbindingSource.Sort = "";
		this.MFD_L_BindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem10;
		this.MFD_L_BindingNavigator.BindingSource = this.allLogsbindingSource;
		this.MFD_L_BindingNavigator.CountItem = this.toolStripLabel1;
		this.MFD_L_BindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem10;
		this.MFD_L_BindingNavigator.GripStyle = System.Windows.Forms.ToolStripGripStyle.Hidden;
		this.MFD_L_BindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[12]
		{
			this.bindingNavigatorMoveFirstItem10, this.bindingNavigatorMovePreviousItem10, this.toolStripSeparator2, this.toolStripTextBox1, this.toolStripLabel1, this.toolStripSeparator3, this.bindingNavigatorMoveNextItem10, this.bindingNavigatorMoveLastItem10, this.toolStripSeparator4, this.bindingNavigatorAddNewItem10,
			this.bindingNavigatorDeleteItem10, this.list_L_toolStripButton
		});
		resources.ApplyResources(this.MFD_L_BindingNavigator, "MFD_L_BindingNavigator");
		this.MFD_L_BindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem10;
		this.MFD_L_BindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem10;
		this.MFD_L_BindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem10;
		this.MFD_L_BindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem10;
		this.MFD_L_BindingNavigator.Name = "MFD_L_BindingNavigator";
		this.MFD_L_BindingNavigator.PositionItem = this.toolStripTextBox1;
		this.bindingNavigatorAddNewItem10.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem10, "bindingNavigatorAddNewItem10");
		this.bindingNavigatorAddNewItem10.Name = "bindingNavigatorAddNewItem10";
		this.toolStripLabel1.Name = "toolStripLabel1";
		resources.ApplyResources(this.toolStripLabel1, "toolStripLabel1");
		this.bindingNavigatorDeleteItem10.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem10, "bindingNavigatorDeleteItem10");
		this.bindingNavigatorDeleteItem10.Name = "bindingNavigatorDeleteItem10";
		this.bindingNavigatorMoveFirstItem10.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem10, "bindingNavigatorMoveFirstItem10");
		this.bindingNavigatorMoveFirstItem10.Name = "bindingNavigatorMoveFirstItem10";
		this.bindingNavigatorMovePreviousItem10.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem10, "bindingNavigatorMovePreviousItem10");
		this.bindingNavigatorMovePreviousItem10.Name = "bindingNavigatorMovePreviousItem10";
		this.toolStripSeparator2.Name = "toolStripSeparator2";
		resources.ApplyResources(this.toolStripSeparator2, "toolStripSeparator2");
		resources.ApplyResources(this.toolStripTextBox1, "toolStripTextBox1");
		this.toolStripTextBox1.Name = "toolStripTextBox1";
		this.toolStripSeparator3.Name = "toolStripSeparator3";
		resources.ApplyResources(this.toolStripSeparator3, "toolStripSeparator3");
		this.bindingNavigatorMoveNextItem10.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem10, "bindingNavigatorMoveNextItem10");
		this.bindingNavigatorMoveNextItem10.Name = "bindingNavigatorMoveNextItem10";
		this.bindingNavigatorMoveLastItem10.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem10, "bindingNavigatorMoveLastItem10");
		this.bindingNavigatorMoveLastItem10.Name = "bindingNavigatorMoveLastItem10";
		this.toolStripSeparator4.Name = "toolStripSeparator4";
		resources.ApplyResources(this.toolStripSeparator4, "toolStripSeparator4");
		this.list_L_toolStripButton.Image = ECS.Properties.Resources.Table;
		resources.ApplyResources(this.list_L_toolStripButton, "list_L_toolStripButton");
		this.list_L_toolStripButton.Name = "list_L_toolStripButton";
		this.list_L_toolStripButton.Click += new System.EventHandler(list_L_toolStripButton_Click);
		this.MFD_L_ToolStrip.BackColor = System.Drawing.Color.FromArgb(255, 255, 128);
		this.MFD_L_ToolStrip.GripStyle = System.Windows.Forms.ToolStripGripStyle.Hidden;
		this.MFD_L_ToolStrip.Items.AddRange(new System.Windows.Forms.ToolStripItem[2] { this.log_ToolStripLabel, this.expand_L_toolStripButton });
		resources.ApplyResources(this.MFD_L_ToolStrip, "MFD_L_ToolStrip");
		this.MFD_L_ToolStrip.Name = "MFD_L_ToolStrip";
		this.log_ToolStripLabel.Name = "log_ToolStripLabel";
		resources.ApplyResources(this.log_ToolStripLabel, "log_ToolStripLabel");
		this.expand_L_toolStripButton.Alignment = System.Windows.Forms.ToolStripItemAlignment.Right;
		this.expand_L_toolStripButton.Image = ECS.Properties.Resources.Expand;
		resources.ApplyResources(this.expand_L_toolStripButton, "expand_L_toolStripButton");
		this.expand_L_toolStripButton.Name = "expand_L_toolStripButton";
		this.expand_L_toolStripButton.Click += new System.EventHandler(expand_L_toolStripButton_Click);
		this.allStock_DataGridView.AllowUserToAddRows = false;
		this.allStock_DataGridView.AllowUserToDeleteRows = false;
		this.allStock_DataGridView.AutoGenerateColumns = false;
		this.allStock_DataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.allStock_DataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.allStock_DataGridView, "allStock_DataGridView");
		this.allStock_DataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.allStock_DataGridView.Columns.AddRange(this.kIDDataGridViewTextBoxColumn4, this.kIDTimeDataGridViewTextBoxColumn4, this.gIDDataGridViewTextBoxColumn4, this.gIDDataGridViewComboBoxColumn4, this.pLUDataGridViewTextBoxColumn4, this.pLUDataGridViewComboBoxColumn4, this.unitDataGridViewTextBoxColumn4, this.unitDataGridViewComboBoxColumn4, this.amountDataGridViewTextBoxColumn4, this.sTakingTimeDataGridViewTextBoxColumn4, this.spoilageDataGridViewTextBoxColumn4, this.inAmountDataGridViewTextBoxColumn4, this.inMoneyDataGridViewTextBoxColumn4, this.safetyStockDataGridViewTextBoxColumn4, this.lowStockDataGridViewCheckBoxColumn4, this.orderDataGridViewTextBoxColumn4);
		this.allStock_DataGridView.DataSource = this.allStockbindingSource;
		this.allStock_DataGridView.Name = "allStock_DataGridView";
		this.allStock_DataGridView.ReadOnly = true;
		this.allStock_DataGridView.RowTemplate.Height = 23;
		this.allStock_DataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(allStock_DataGridView_DataError);
		this.kIDDataGridViewTextBoxColumn4.DataPropertyName = "KID";
		resources.ApplyResources(this.kIDDataGridViewTextBoxColumn4, "kIDDataGridViewTextBoxColumn4");
		this.kIDDataGridViewTextBoxColumn4.Name = "kIDDataGridViewTextBoxColumn4";
		this.kIDDataGridViewTextBoxColumn4.ReadOnly = true;
		this.kIDTimeDataGridViewTextBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.kIDTimeDataGridViewTextBoxColumn4.DataPropertyName = "KID_Time";
		resources.ApplyResources(this.kIDTimeDataGridViewTextBoxColumn4, "kIDTimeDataGridViewTextBoxColumn4");
		this.kIDTimeDataGridViewTextBoxColumn4.Name = "kIDTimeDataGridViewTextBoxColumn4";
		this.kIDTimeDataGridViewTextBoxColumn4.ReadOnly = true;
		this.gIDDataGridViewTextBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.gIDDataGridViewTextBoxColumn4.DataPropertyName = "GID";
		this.gIDDataGridViewTextBoxColumn4.FillWeight = 30f;
		resources.ApplyResources(this.gIDDataGridViewTextBoxColumn4, "gIDDataGridViewTextBoxColumn4");
		this.gIDDataGridViewTextBoxColumn4.Name = "gIDDataGridViewTextBoxColumn4";
		this.gIDDataGridViewTextBoxColumn4.ReadOnly = true;
		this.gIDDataGridViewComboBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.gIDDataGridViewComboBoxColumn4.DataPropertyName = "Name";
		this.gIDDataGridViewComboBoxColumn4.FillWeight = 60f;
		resources.ApplyResources(this.gIDDataGridViewComboBoxColumn4, "gIDDataGridViewComboBoxColumn4");
		this.gIDDataGridViewComboBoxColumn4.Name = "gIDDataGridViewComboBoxColumn4";
		this.gIDDataGridViewComboBoxColumn4.ReadOnly = true;
		this.pLUDataGridViewTextBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUDataGridViewTextBoxColumn4.DataPropertyName = "PLU";
		this.pLUDataGridViewTextBoxColumn4.FillWeight = 50f;
		resources.ApplyResources(this.pLUDataGridViewTextBoxColumn4, "pLUDataGridViewTextBoxColumn4");
		this.pLUDataGridViewTextBoxColumn4.Name = "pLUDataGridViewTextBoxColumn4";
		this.pLUDataGridViewTextBoxColumn4.ReadOnly = true;
		this.pLUDataGridViewComboBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUDataGridViewComboBoxColumn4.DataPropertyName = "PLUName";
		resources.ApplyResources(this.pLUDataGridViewComboBoxColumn4, "pLUDataGridViewComboBoxColumn4");
		this.pLUDataGridViewComboBoxColumn4.Name = "pLUDataGridViewComboBoxColumn4";
		this.pLUDataGridViewComboBoxColumn4.ReadOnly = true;
		this.unitDataGridViewTextBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitDataGridViewTextBoxColumn4.DataPropertyName = "Unit";
		this.unitDataGridViewTextBoxColumn4.FillWeight = 30f;
		resources.ApplyResources(this.unitDataGridViewTextBoxColumn4, "unitDataGridViewTextBoxColumn4");
		this.unitDataGridViewTextBoxColumn4.Name = "unitDataGridViewTextBoxColumn4";
		this.unitDataGridViewTextBoxColumn4.ReadOnly = true;
		this.unitDataGridViewComboBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitDataGridViewComboBoxColumn4.DataPropertyName = "UnitName";
		this.unitDataGridViewComboBoxColumn4.FillWeight = 50f;
		resources.ApplyResources(this.unitDataGridViewComboBoxColumn4, "unitDataGridViewComboBoxColumn4");
		this.unitDataGridViewComboBoxColumn4.Name = "unitDataGridViewComboBoxColumn4";
		this.unitDataGridViewComboBoxColumn4.ReadOnly = true;
		this.amountDataGridViewTextBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.amountDataGridViewTextBoxColumn4.DataPropertyName = "Amount";
		this.amountDataGridViewTextBoxColumn4.FillWeight = 50f;
		resources.ApplyResources(this.amountDataGridViewTextBoxColumn4, "amountDataGridViewTextBoxColumn4");
		this.amountDataGridViewTextBoxColumn4.Name = "amountDataGridViewTextBoxColumn4";
		this.amountDataGridViewTextBoxColumn4.ReadOnly = true;
		this.sTakingTimeDataGridViewTextBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.sTakingTimeDataGridViewTextBoxColumn4.DataPropertyName = "STakingTime";
		resources.ApplyResources(this.sTakingTimeDataGridViewTextBoxColumn4, "sTakingTimeDataGridViewTextBoxColumn4");
		this.sTakingTimeDataGridViewTextBoxColumn4.Name = "sTakingTimeDataGridViewTextBoxColumn4";
		this.sTakingTimeDataGridViewTextBoxColumn4.ReadOnly = true;
		this.spoilageDataGridViewTextBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.spoilageDataGridViewTextBoxColumn4.DataPropertyName = "Spoilage";
		this.spoilageDataGridViewTextBoxColumn4.FillWeight = 50f;
		resources.ApplyResources(this.spoilageDataGridViewTextBoxColumn4, "spoilageDataGridViewTextBoxColumn4");
		this.spoilageDataGridViewTextBoxColumn4.Name = "spoilageDataGridViewTextBoxColumn4";
		this.spoilageDataGridViewTextBoxColumn4.ReadOnly = true;
		this.inAmountDataGridViewTextBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.inAmountDataGridViewTextBoxColumn4.DataPropertyName = "In_Amount";
		this.inAmountDataGridViewTextBoxColumn4.FillWeight = 50f;
		resources.ApplyResources(this.inAmountDataGridViewTextBoxColumn4, "inAmountDataGridViewTextBoxColumn4");
		this.inAmountDataGridViewTextBoxColumn4.Name = "inAmountDataGridViewTextBoxColumn4";
		this.inAmountDataGridViewTextBoxColumn4.ReadOnly = true;
		this.inMoneyDataGridViewTextBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.inMoneyDataGridViewTextBoxColumn4.DataPropertyName = "In_Money";
		this.inMoneyDataGridViewTextBoxColumn4.FillWeight = 50f;
		resources.ApplyResources(this.inMoneyDataGridViewTextBoxColumn4, "inMoneyDataGridViewTextBoxColumn4");
		this.inMoneyDataGridViewTextBoxColumn4.Name = "inMoneyDataGridViewTextBoxColumn4";
		this.inMoneyDataGridViewTextBoxColumn4.ReadOnly = true;
		this.safetyStockDataGridViewTextBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.safetyStockDataGridViewTextBoxColumn4.DataPropertyName = "SafetyStock";
		this.safetyStockDataGridViewTextBoxColumn4.FillWeight = 50f;
		resources.ApplyResources(this.safetyStockDataGridViewTextBoxColumn4, "safetyStockDataGridViewTextBoxColumn4");
		this.safetyStockDataGridViewTextBoxColumn4.Name = "safetyStockDataGridViewTextBoxColumn4";
		this.safetyStockDataGridViewTextBoxColumn4.ReadOnly = true;
		this.lowStockDataGridViewCheckBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.lowStockDataGridViewCheckBoxColumn4.DataPropertyName = "LowStock";
		this.lowStockDataGridViewCheckBoxColumn4.FillWeight = 40f;
		resources.ApplyResources(this.lowStockDataGridViewCheckBoxColumn4, "lowStockDataGridViewCheckBoxColumn4");
		this.lowStockDataGridViewCheckBoxColumn4.Name = "lowStockDataGridViewCheckBoxColumn4";
		this.lowStockDataGridViewCheckBoxColumn4.ReadOnly = true;
		this.orderDataGridViewTextBoxColumn4.DataPropertyName = "Order";
		resources.ApplyResources(this.orderDataGridViewTextBoxColumn4, "orderDataGridViewTextBoxColumn4");
		this.orderDataGridViewTextBoxColumn4.Name = "orderDataGridViewTextBoxColumn4";
		this.orderDataGridViewTextBoxColumn4.ReadOnly = true;
		this.allStockbindingSource.AllowNew = false;
		this.allStockbindingSource.DataMember = "AllStocks";
		this.allStockbindingSource.DataSource = this.reportDataSet;
		this.allStockbindingSource.Sort = "KID_Time DESC";
		this.MFD_R_BindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem11;
		this.MFD_R_BindingNavigator.BindingSource = this.allStockbindingSource;
		this.MFD_R_BindingNavigator.CountItem = this.toolStripLabel2;
		this.MFD_R_BindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem11;
		this.MFD_R_BindingNavigator.GripStyle = System.Windows.Forms.ToolStripGripStyle.Hidden;
		this.MFD_R_BindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[14]
		{
			this.bindingNavigatorMoveFirstItem11, this.bindingNavigatorMovePreviousItem11, this.toolStripSeparator5, this.toolStripTextBox2, this.toolStripLabel2, this.toolStripSeparator6, this.bindingNavigatorMoveNextItem11, this.bindingNavigatorMoveLastItem11, this.toolStripSeparator7, this.bindingNavigatorAddNewItem11,
			this.bindingNavigatorDeleteItem11, this.list_R_toolStripButton, this.editStock2_ToolStripButton, this.ExcelSCV2_ToolStripButton
		});
		resources.ApplyResources(this.MFD_R_BindingNavigator, "MFD_R_BindingNavigator");
		this.MFD_R_BindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem11;
		this.MFD_R_BindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem11;
		this.MFD_R_BindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem11;
		this.MFD_R_BindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem11;
		this.MFD_R_BindingNavigator.Name = "MFD_R_BindingNavigator";
		this.MFD_R_BindingNavigator.PositionItem = this.toolStripTextBox2;
		this.bindingNavigatorAddNewItem11.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem11, "bindingNavigatorAddNewItem11");
		this.bindingNavigatorAddNewItem11.Name = "bindingNavigatorAddNewItem11";
		this.toolStripLabel2.Name = "toolStripLabel2";
		resources.ApplyResources(this.toolStripLabel2, "toolStripLabel2");
		this.bindingNavigatorDeleteItem11.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem11, "bindingNavigatorDeleteItem11");
		this.bindingNavigatorDeleteItem11.Name = "bindingNavigatorDeleteItem11";
		this.bindingNavigatorMoveFirstItem11.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem11, "bindingNavigatorMoveFirstItem11");
		this.bindingNavigatorMoveFirstItem11.Name = "bindingNavigatorMoveFirstItem11";
		this.bindingNavigatorMovePreviousItem11.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem11, "bindingNavigatorMovePreviousItem11");
		this.bindingNavigatorMovePreviousItem11.Name = "bindingNavigatorMovePreviousItem11";
		this.toolStripSeparator5.Name = "toolStripSeparator5";
		resources.ApplyResources(this.toolStripSeparator5, "toolStripSeparator5");
		resources.ApplyResources(this.toolStripTextBox2, "toolStripTextBox2");
		this.toolStripTextBox2.Name = "toolStripTextBox2";
		this.toolStripSeparator6.Name = "toolStripSeparator6";
		resources.ApplyResources(this.toolStripSeparator6, "toolStripSeparator6");
		this.bindingNavigatorMoveNextItem11.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem11, "bindingNavigatorMoveNextItem11");
		this.bindingNavigatorMoveNextItem11.Name = "bindingNavigatorMoveNextItem11";
		this.bindingNavigatorMoveLastItem11.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem11, "bindingNavigatorMoveLastItem11");
		this.bindingNavigatorMoveLastItem11.Name = "bindingNavigatorMoveLastItem11";
		this.toolStripSeparator7.Name = "toolStripSeparator7";
		resources.ApplyResources(this.toolStripSeparator7, "toolStripSeparator7");
		this.list_R_toolStripButton.Image = ECS.Properties.Resources.Table;
		resources.ApplyResources(this.list_R_toolStripButton, "list_R_toolStripButton");
		this.list_R_toolStripButton.Name = "list_R_toolStripButton";
		this.list_R_toolStripButton.Click += new System.EventHandler(list_R_toolStripButton_Click);
		this.editStock2_ToolStripButton.Image = ECS.Properties.Resources.Edit;
		resources.ApplyResources(this.editStock2_ToolStripButton, "editStock2_ToolStripButton");
		this.editStock2_ToolStripButton.Name = "editStock2_ToolStripButton";
		this.editStock2_ToolStripButton.Click += new System.EventHandler(editStockSim_ToolStripButton_Click);
		this.ExcelSCV2_ToolStripButton.Image = ECS.Properties.Resources.Table;
		resources.ApplyResources(this.ExcelSCV2_ToolStripButton, "ExcelSCV2_ToolStripButton");
		this.ExcelSCV2_ToolStripButton.Name = "ExcelSCV2_ToolStripButton";
		this.ExcelSCV2_ToolStripButton.Click += new System.EventHandler(ExcelSCV2_ToolStripButton_Click);
		this.MFD_R_ToolStrip.BackColor = System.Drawing.Color.FromArgb(255, 255, 128);
		this.MFD_R_ToolStrip.GripStyle = System.Windows.Forms.ToolStripGripStyle.Hidden;
		this.MFD_R_ToolStrip.Items.AddRange(new System.Windows.Forms.ToolStripItem[2] { this.stock_ToolStripLabel, this.expand_R_toolStripButton });
		resources.ApplyResources(this.MFD_R_ToolStrip, "MFD_R_ToolStrip");
		this.MFD_R_ToolStrip.Name = "MFD_R_ToolStrip";
		this.stock_ToolStripLabel.Name = "stock_ToolStripLabel";
		resources.ApplyResources(this.stock_ToolStripLabel, "stock_ToolStripLabel");
		this.expand_R_toolStripButton.Alignment = System.Windows.Forms.ToolStripItemAlignment.Right;
		this.expand_R_toolStripButton.Image = ECS.Properties.Resources.Expand;
		resources.ApplyResources(this.expand_R_toolStripButton, "expand_R_toolStripButton");
		this.expand_R_toolStripButton.Name = "expand_R_toolStripButton";
		this.expand_R_toolStripButton.Click += new System.EventHandler(expand_R_toolStripButton_Click);
		this.excelTableAdapter.ClearBeforeFill = true;
		this.exprTableAdapter.ClearBeforeFill = true;
		this.deviceTableAdapter.ClearBeforeFill = true;
		this.logTableAdapter.ClearBeforeFill = true;
		this.sGroupTableAdapter.ClearBeforeFill = true;
		this.logItemTableAdapter.ClearBeforeFill = true;
		this.stockItemTableAdapter.ClearBeforeFill = true;
		this.stockTableAdapter.ClearBeforeFill = true;
		this.rPLUTableAdapter.ClearBeforeFill = true;
		this.rUnitTableAdapter.ClearBeforeFill = true;
		this.allLogsTableAdapter.ClearBeforeFill = true;
		this.allStocksTableAdapter.ClearBeforeFill = true;
		this.rLogsTypeTableAdapter.ClearBeforeFill = true;
		this.rStockTypeTableAdapter.ClearBeforeFill = true;
		this.resultLogItemTableAdapter.ClearBeforeFill = true;
		this.resultLogTableAdapter.ClearBeforeFill = true;
		this.bindingSource1.AllowNew = false;
		this.bindingSource1.DataMember = "AllStocks";
		this.bindingSource1.DataSource = this.reportDataSet;
		this.bindingSource1.Sort = "KID_Time DESC";
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.MF_SplitContainer);
		base.Name = "ReportForm";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(ReportForm_FormClosing);
		base.FormClosed += new System.Windows.Forms.FormClosedEventHandler(ReportForm_FormClosed);
		base.Load += new System.EventHandler(ReportForm_Load);
		base.Enter += new System.EventHandler(ReportForm_Enter);
		this.splitContainer6.Panel1.ResumeLayout(false);
		this.splitContainer6.Panel2.ResumeLayout(false);
		this.splitContainer6.Panel2.PerformLayout();
		this.splitContainer6.ResumeLayout(false);
		this.importRS232_GroupBox.ResumeLayout(false);
		this.importRS232_GroupBox.PerformLayout();
		this.importFile_GroupBox.ResumeLayout(false);
		this.importFile_GroupBox.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.resultLogItemBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.resultLogBindingSource).EndInit();
		this.Data_SplitContainer.Panel1.ResumeLayout(false);
		this.Data_SplitContainer.Panel2.ResumeLayout(false);
		this.Data_SplitContainer.Panel2.PerformLayout();
		this.Data_SplitContainer.ResumeLayout(false);
		this.Data_Upper_SplitContainer.Panel1.ResumeLayout(false);
		this.Data_Upper_SplitContainer.Panel1.PerformLayout();
		this.Data_Upper_SplitContainer.Panel2.ResumeLayout(false);
		this.Data_Upper_SplitContainer.Panel2.PerformLayout();
		this.Data_Upper_SplitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.tableDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.sGroupBindingSource2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.deviceBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.tableBindingNavigator).EndInit();
		this.tableBindingNavigator.ResumeLayout(false);
		this.tableBindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.reportDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.logBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.reportBindingNavigator).EndInit();
		this.reportBindingNavigator.ResumeLayout(false);
		this.reportBindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.reportItemDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.logTypeBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.logItemBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.reportItemBindingNavigator).EndInit();
		this.reportItemBindingNavigator.ResumeLayout(false);
		this.reportItemBindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.pluBindingSource).EndInit();
		this.Analysis_SplitContainer.Panel1.ResumeLayout(false);
		this.Analysis_SplitContainer.Panel2.ResumeLayout(false);
		this.Analysis_SplitContainer.ResumeLayout(false);
		this.Analysis_Left_TabControl.ResumeLayout(false);
		this.Filter_TabPage.ResumeLayout(false);
		this.splitContainer1.Panel1.ResumeLayout(false);
		this.splitContainer1.Panel1.PerformLayout();
		this.splitContainer1.Panel2.ResumeLayout(false);
		this.splitContainer1.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.exprDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.exprBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.exprBindingNavigator).EndInit();
		this.exprBindingNavigator.ResumeLayout(false);
		this.exprBindingNavigator.PerformLayout();
		this.groupBox1.ResumeLayout(false);
		this.groupBox1.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.op1_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.op2_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.report_ColBindingSource2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.sGroupBindingSource1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.deviceBindingSource1).EndInit();
		this.Analysis_ImExport_TabPage.ResumeLayout(false);
		this.splitContainer3.Panel1.ResumeLayout(false);
		this.splitContainer3.Panel1.PerformLayout();
		this.splitContainer3.Panel2.ResumeLayout(false);
		this.splitContainer3.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.excelDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.report_ColBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.excelBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.excelBindingNavigator).EndInit();
		this.excelBindingNavigator.ResumeLayout(false);
		this.excelBindingNavigator.PerformLayout();
		this.Analysis_Right_TabControl.ResumeLayout(false);
		this.List_TabPage.ResumeLayout(false);
		this.splitContainer5.Panel1.ResumeLayout(false);
		this.splitContainer5.Panel1.PerformLayout();
		this.splitContainer5.Panel2.ResumeLayout(false);
		this.splitContainer5.Panel2.PerformLayout();
		this.splitContainer5.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.dataGridView1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.resultlogBindingNavigator).EndInit();
		this.resultlogBindingNavigator.ResumeLayout(false);
		this.resultlogBindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.resultDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.logType2BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.resultBindingNavigator).EndInit();
		this.resultBindingNavigator.ResumeLayout(false);
		this.resultBindingNavigator.PerformLayout();
		this.Report_TabPage.ResumeLayout(false);
		this.splitContainer2.Panel1.ResumeLayout(false);
		this.splitContainer2.Panel2.ResumeLayout(false);
		this.splitContainer2.Panel2.PerformLayout();
		this.splitContainer2.ResumeLayout(false);
		this.splitContainer4.Panel1.ResumeLayout(false);
		this.splitContainer4.Panel1.PerformLayout();
		this.splitContainer4.Panel2.ResumeLayout(false);
		this.splitContainer4.Panel2.PerformLayout();
		this.splitContainer4.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.sGroupDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.sGroupBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.sGroupBindingNavigator).EndInit();
		this.sGroupBindingNavigator.ResumeLayout(false);
		this.sGroupBindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.stockItemDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.stockTypeBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.stockItemBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.stockItemBindingNavigator).EndInit();
		this.stockItemBindingNavigator.ResumeLayout(false);
		this.stockItemBindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.stockDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.stockBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.stockBindingNavigator).EndInit();
		this.stockBindingNavigator.ResumeLayout(false);
		this.stockBindingNavigator.PerformLayout();
		this.Main_TabControl.ResumeLayout(false);
		this.Sale_TabPage.ResumeLayout(false);
		this.Sale_TabControl.ResumeLayout(false);
		this.Data_TabPage.ResumeLayout(false);
		this.DataImport_TabPage.ResumeLayout(false);
		this.Analysis_TabPage.ResumeLayout(false);
		this.Stock_TabPage.ResumeLayout(false);
		this.MF_SplitContainer.Panel1.ResumeLayout(false);
		this.MF_SplitContainer.Panel1.PerformLayout();
		this.MF_SplitContainer.Panel2.ResumeLayout(false);
		this.MF_SplitContainer.ResumeLayout(false);
		this.shrink_ToolStrip.ResumeLayout(false);
		this.shrink_ToolStrip.PerformLayout();
		this.MF_D_SplitContainer.Panel1.ResumeLayout(false);
		this.MF_D_SplitContainer.Panel1.PerformLayout();
		this.MF_D_SplitContainer.Panel2.ResumeLayout(false);
		this.MF_D_SplitContainer.Panel2.PerformLayout();
		this.MF_D_SplitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.allLog_DataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.allLogsbindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.MFD_L_BindingNavigator).EndInit();
		this.MFD_L_BindingNavigator.ResumeLayout(false);
		this.MFD_L_BindingNavigator.PerformLayout();
		this.MFD_L_ToolStrip.ResumeLayout(false);
		this.MFD_L_ToolStrip.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.allStock_DataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.allStockbindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.MFD_R_BindingNavigator).EndInit();
		this.MFD_R_BindingNavigator.ResumeLayout(false);
		this.MFD_R_BindingNavigator.PerformLayout();
		this.MFD_R_ToolStrip.ResumeLayout(false);
		this.MFD_R_ToolStrip.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.bindingSource1).EndInit();
		base.ResumeLayout(false);
	}

	public ReportForm()
	{
		InitializeComponent();
	}

	private void UploadReport_Log_Info_Tip(string Info)
	{
		if (ReportInfo_TextBox.InvokeRequired)
		{
			Invoke(new UploadReport_Log_Info_Tip_Callback(UploadReport_Log_Info_Tip), Info);
			return;
		}
		string text = ReportInfo_TextBox.Text;
		if (text.Length >= 4096)
		{
			text.Substring(text.IndexOf("\r\n", 2048), 0);
		}
		ReportInfo_TextBox.Text = text + Info;
	}

	private void UploadReport_Log_Info(string Info)
	{
		UploadReport_Log_Info_Tip(Info);
	}

	private void UploadReport_Log_Error_Tip(string Error)
	{
		if (ReportError_TextBox.InvokeRequired)
		{
			Invoke(new UploadReport_Log_Error_Tip_Callback(UploadReport_Log_Error_Tip), Error);
			return;
		}
		string text = ReportError_TextBox.Text;
		if (text.Length >= 4096)
		{
			text.Substring(text.IndexOf("\r\n", 2048), 0);
		}
		ReportError_TextBox.Text = text + Error;
	}

	private void UploadReport_Log_Error(string Error)
	{
		UploadReport_Log_Error_Tip(Error);
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
			return;
		}
		switch (Type)
		{
		case "Report":
			DataSet_NeedRefresh_Report_Dock = (DataSet_NeedRefresh_Report = true);
			break;
		case "PLU":
			DataSet_NeedRefresh_PLU = true;
			NeedCopyPU = true;
			break;
		}
		DataSet_Refresh_DoAll(Focused);
	}

	private void ReportForm_Enter(object sender, EventArgs e)
	{
		if (FormLoad_OK)
		{
			DataSet_Refresh_DoAll(fucosed: true);
		}
	}

	public void DataSet_Refresh_DoAll(bool fucosed, bool always = false)
	{
		if (mf_Docked)
		{
			if (!MF_SplitContainer.Panel1Collapsed)
			{
				DataSet_Refresh_Do("Report", always);
				DataSet_Refresh_Do("Unit", always);
				DataSet_Refresh_Do("PLU", always);
			}
			if (!MF_SplitContainer.Panel2Collapsed)
			{
				DataSet_Refresh_Do("Report_Dock", always);
			}
		}
		else if (fucosed)
		{
			DataSet_Refresh_Do("Report", always);
			DataSet_Refresh_Do("Unit", always);
			DataSet_Refresh_Do("PLU", always);
		}
	}

	public void DataSet_Refresh_Do(string Type, bool always = false)
	{
		if (!DataSet_OK)
		{
			return;
		}
		switch (Type)
		{
		case "Report_Dock":
			if (always || (!MF_SplitContainer.Panel2Collapsed && (DataSet_NeedRefresh_Report_Dock || NeedCopyPU)))
			{
				using (OleDbConnection conn = new OleDbConnection(Settings.Default.ReportConnectionString))
				{
					copyPUtable(conn);
				}
				allLogsTableAdapter.Fill(reportDataSet.AllLogs);
				allStocksTableAdapter.Fill(reportDataSet.AllStocks);
				allLogsbindingSource.ResetBindings(metadataChanged: false);
				allStockbindingSource.ResetBindings(metadataChanged: false);
				DataSet_NeedRefresh_Report_Dock = false;
			}
			break;
		case "Report":
			if (!always && (MF_SplitContainer.Panel1Collapsed || !DataSet_NeedRefresh_Report))
			{
				break;
			}
			sGroupTableAdapter.Fill(reportDataSet.SGroup);
			deviceTableAdapter.Fill(reportDataSet.Device);
			stockTableAdapter.Fill(reportDataSet.Stock);
			stockItemTableAdapter.FillPart(reportDataSet.StockItem);
			logItemBindingSource.ResetBindings(metadataChanged: false);
			logBindingSource.ResetBindings(metadataChanged: false);
			deviceBindingSource.ResetBindings(metadataChanged: false);
			stockItemBindingSource.ResetBindings(metadataChanged: false);
			stockBindingSource.ResetBindings(metadataChanged: false);
			sGroupBindingSource.ResetBindings(metadataChanged: false);
			filterDoButton.Enabled = true;
			filterButton.Enabled = true;
			foreach (ListViewItem item in listView.Items)
			{
				UpdateTableTypeText(item);
			}
			sGroupBindingSource_CurrentChanged();
			DataSet_NeedRefresh_Report = false;
			break;
		case "PLU":
		{
			if (!always && (MF_SplitContainer.Panel1Collapsed || !DataSet_NeedRefresh_PLU))
			{
				break;
			}
			pluTableAdapter.ClearBeforeFill = true;
			pluTableAdapter.Fill(ecsDataSet.PLU);
			string[] array = uIDataSet.SimCombo.FindByName("PLU Default").ValueDisplay.Split('|');
			pluDefault = new SimComboVD_No[array.Length / 2];
			for (int i = 0; i < array.Length / 2; i++)
			{
				int num = int.Parse(array[i * 2]);
				if (ecsDataSet.PLU.FindByPLUID(num) == null)
				{
					ECSDataSet.PLURow pLURow = ecsDataSet.PLU.NewPLURow();
					pLURow.PLUID = num;
					pLURow.Name = array[i * 2 + 1];
					if (num == 9999999)
					{
						pLURow.UnitID = 1;
					}
					else
					{
						pLURow.UnitID = 2;
					}
					ecsDataSet.PLU.AddPLURow(pLURow);
				}
			}
			DataSet_NeedRefresh_PLU = false;
			break;
		}
		}
	}

	private void DataSet_Update(string Type)
	{
		sGroupBindingSource_CurrentChanged();
		Program.mf.DataSet_Update(Type, "ReportForm");
		if (Type == "Report")
		{
			DataSet_Refresh(Type);
		}
	}

	private void ReportForm_Load(object sender, EventArgs e)
	{
		Sale_TabPage.Text = Program.GetLang("pw_Logs");
		report_ToolStripLabel.Text = Program.GetLang("pw_Report");
		log_ToolStripLabel.Text = Program.GetLang("pw_Report") + ": " + Program.GetLang("pw_DeviceLogs");
		stock_ToolStripLabel.Text = Program.GetLang("pw_Report") + ": " + Program.GetLang("pw_Stock");
		ExcelSCV_ToolStripButton.Text = Program.GetLang("pw_ExcelCSVImport");
		ExcelSCV2_ToolStripButton.Text = Program.GetLang("pw_ExcelCSVImport");
		Text = Program.GetLang("pw_Report");
		shrink_ToolStrip.Visible = false;
		MF_SplitContainer.Panel2Collapsed = true;
		list_L_toolStripButton.Text = Program.GetLang("pw_GridElement");
		list_R_toolStripButton.Text = Program.GetLang("pw_GridElement");
		expand_L_toolStripButton.Text = Program.GetLang("pw_Expand");
		expand_R_toolStripButton.Text = Program.GetLang("pw_Expand");
		shrink_R_ToolStripButton.Text = Program.GetLang("pw_Shrink");
		ToolStripButton toolStripButton = editStock_ToolStripButton;
		string text = (editStock2_ToolStripButton.Text = Program.GetLang("pw_EditStock"));
		toolStripButton.Text = text;
		bindingNavigatorFilter.Text = Program.GetLang("pw_Filter");
		FilterAdd_ToolStripButton.Text = Program.GetLang("pw_Filter") + "+";
		kIDTimeDataGridViewTextBoxColumn4.HeaderText = Program.GetLang("pw_LastUpdate");
		gIDDataGridViewTextBoxColumn4.HeaderText = Program.GetLang("pw_StockTableNumber");
		gIDDataGridViewComboBoxColumn4.HeaderText = Program.GetLang("pw_StockTable");
		pLUDataGridViewTextBoxColumn4.HeaderText = Program.GetLang("pw_PLUNo");
		pLUDataGridViewComboBoxColumn4.HeaderText = Program.GetLang("pw_PLUName");
		unitDataGridViewTextBoxColumn4.HeaderText = Program.GetLang("pw_UnitNo");
		unitDataGridViewComboBoxColumn4.HeaderText = Program.GetLang("pw_UnitName");
		amountDataGridViewTextBoxColumn4.HeaderText = Program.GetLang("pw_AmountInStock");
		sTakingTimeDataGridViewTextBoxColumn4.HeaderText = Program.GetLang("pw_LastStocktaking");
		spoilageDataGridViewTextBoxColumn4.HeaderText = Program.GetLang("pw_Spoilage");
		safetyStockDataGridViewTextBoxColumn4.HeaderText = Program.GetLang("pw_SafetyStock");
		lowStockDataGridViewCheckBoxColumn4.HeaderText = Program.GetLang("pw_LowStock");
		inAmountDataGridViewTextBoxColumn4.HeaderText = "<+>" + Program.GetLang("pw_AmountBalance");
		inMoneyDataGridViewTextBoxColumn4.HeaderText = "<+>" + Program.GetLang("pw_MoneyBalance");
		orderDataGridViewTextBoxColumn4.HeaderText = Program.GetLang("pw_Order");
		kIDTimeDataGridViewTextBoxColumn4.Visible = Settings.Default.MFR_R_LastUpdate;
		gIDDataGridViewTextBoxColumn4.Visible = Settings.Default.MFR_R_StockTableNumber;
		gIDDataGridViewComboBoxColumn4.Visible = Settings.Default.MFR_R_StockTable;
		pLUDataGridViewTextBoxColumn4.Visible = Settings.Default.MFR_R_PLUNo;
		pLUDataGridViewComboBoxColumn4.Visible = Settings.Default.MFR_R_PLUName;
		unitDataGridViewTextBoxColumn4.Visible = Settings.Default.MFR_R_UnitNo;
		unitDataGridViewComboBoxColumn4.Visible = Settings.Default.MFR_R_UnitName;
		amountDataGridViewTextBoxColumn4.Visible = Settings.Default.MFR_R_Amount;
		sTakingTimeDataGridViewTextBoxColumn4.Visible = Settings.Default.MFR_R_LastStocktaking;
		spoilageDataGridViewTextBoxColumn4.Visible = Settings.Default.MFR_R_Spoilage;
		inAmountDataGridViewTextBoxColumn4.Visible = Settings.Default.MFR_R_SafetyStock;
		inMoneyDataGridViewTextBoxColumn4.Visible = Settings.Default.MFR_R_LowStock;
		safetyStockDataGridViewTextBoxColumn4.Visible = Settings.Default.MFR_R_psAmount;
		lowStockDataGridViewCheckBoxColumn4.Visible = Settings.Default.MFR_R_psMoney;
		orderDataGridViewTextBoxColumn4.Visible = Settings.Default.MFR_R_Order;
		amountDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_Amount");
		classDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_AffiliatedClass");
		coFIDDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_RelatedFID");
		dateTimeDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_DateTime");
		deptDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_AffiliatedDept");
		fIDDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_FID");
		nameDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_DeviceName");
		pLUDataGridViewComboBoxColumn3.HeaderText = Program.GetLang("pw_PLUName");
		pLUDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_PLUNo");
		priceDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_Money");
		salesmanDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_SalesmanNo");
		sIDDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_SID");
		subIDDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_SubID");
		subIDDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_SubID");
		taxDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_Tax");
		text1DataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_Text1");
		text2DataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_Text2");
		text3DataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_Text3");
		text4DataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_Text4");
		typeDataGridViewComboBoxColumn3.HeaderText = Program.GetLang("pw_Type");
		typeDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_TypeNo");
		unitDataGridViewComboBoxColumn3.HeaderText = Program.GetLang("pw_UnitName");
		unitDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_UnitNo");
		unitPriceDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_UnitPrice");
		amountDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_Amount;
		classDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_AffiliatedClass;
		coFIDDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_RelatedFID;
		dateTimeDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_DateTime;
		deptDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_AffiliatedDept;
		fIDDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_FID;
		mACDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_MAC;
		nameDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_DeviceName;
		pLUDataGridViewComboBoxColumn3.Visible = Settings.Default.MFR_L_PLUName;
		pLUDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_PLUNo;
		priceDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_Money;
		salesmanDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_SalesmanNo;
		sIDDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_SID;
		subIDDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_SubID;
		taxDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_Tax;
		text1DataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_Text1;
		text2DataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_Text2;
		text3DataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_Text3;
		text4DataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_Text4;
		typeDataGridViewComboBoxColumn3.Visible = Settings.Default.MFR_L_Type;
		typeDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_TypeNo;
		unitDataGridViewComboBoxColumn3.Visible = Settings.Default.MFR_L_UnitName;
		unitDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_UnitNo;
		unitPriceDataGridViewTextBoxColumn3.Visible = Settings.Default.MFR_L_UnitPrice;
		_Text1Column.HeaderText = Program.GetLang("pw_Text1");
		_Text2Column.HeaderText = Program.GetLang("pw_Text2");
		_Text3Column.HeaderText = Program.GetLang("pw_Text3");
		_Text4Column.HeaderText = Program.GetLang("pw_Text4");
		addAllToolStripButton.Text = Program.GetLang("pw_AddAll");
		allCheckBox.Text = Program.GetLang("pw_SelectAll");
		allDefaultStock_Button.Text = Program.GetLang("pw_Attachautomatically");
		amountDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Amount");
		amountDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Amount");
		amountDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_Amount");
		amountDataGridViewTextBoxColumn2_1.HeaderText = Program.GetLang("pw_AmountInStock");
		amountSPDataGridViewTextBoxColumn2.HeaderText = "<S>" + Program.GetLang("pw_AmountInStock");
		Analysis_ImExport_TabPage.Text = Program.GetLang("pw_Import_Export");
		Analysis_TabPage.Text = Program.GetLang("pw_Analysis");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorAddNewItem1.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorAddNewItem2.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorAddNewItem3.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorAddNewItem4.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorAddNewItem5.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorAddNewItem6.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorAddNewItem7.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorAddNewItem8.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorAddNewItem9.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorAddNewItem10.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorAddNewItem11.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorDeleteItem1.Text = Program.GetLang("pw_Delete");
		bindingNavigatorDeleteItem2.Text = Program.GetLang("pw_Delete");
		bindingNavigatorDeleteItem3.Text = Program.GetLang("pw_Delete");
		bindingNavigatorDeleteItem4.Text = Program.GetLang("pw_Delete");
		bindingNavigatorDeleteItem5.Text = Program.GetLang("pw_Delete");
		bindingNavigatorDeleteItem6.Text = Program.GetLang("pw_Delete");
		bindingNavigatorDeleteItem7.Text = Program.GetLang("pw_Delete");
		bindingNavigatorDeleteItem8.Text = Program.GetLang("pw_Delete");
		bindingNavigatorDeleteItem9.Text = Program.GetLang("pw_Delete");
		bindingNavigatorDeleteItem10.Text = Program.GetLang("pw_Delete");
		bindingNavigatorDeleteItem11.Text = Program.GetLang("pw_Delete");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveFirstItem1.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveFirstItem2.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveFirstItem3.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveFirstItem4.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveFirstItem5.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveFirstItem6.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveFirstItem7.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveFirstItem8.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveFirstItem9.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveFirstItem10.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveFirstItem11.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveLastItem1.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveLastItem2.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveLastItem3.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveLastItem4.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveLastItem5.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveLastItem6.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveLastItem7.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveLastItem8.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveLastItem9.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveLastItem10.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveLastItem11.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMoveNextItem1.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMoveNextItem2.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMoveNextItem3.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMoveNextItem4.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMoveNextItem5.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMoveNextItem6.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMoveNextItem7.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMoveNextItem8.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMoveNextItem9.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMoveNextItem10.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMoveNextItem11.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		bindingNavigatorMovePreviousItem1.Text = Program.GetLang("pw_PreviousRecord");
		bindingNavigatorMovePreviousItem2.Text = Program.GetLang("pw_PreviousRecord");
		bindingNavigatorMovePreviousItem3.Text = Program.GetLang("pw_PreviousRecord");
		bindingNavigatorMovePreviousItem4.Text = Program.GetLang("pw_PreviousRecord");
		bindingNavigatorMovePreviousItem5.Text = Program.GetLang("pw_PreviousRecord");
		bindingNavigatorMovePreviousItem6.Text = Program.GetLang("pw_PreviousRecord");
		bindingNavigatorMovePreviousItem7.Text = Program.GetLang("pw_PreviousRecord");
		bindingNavigatorMovePreviousItem8.Text = Program.GetLang("pw_PreviousRecord");
		bindingNavigatorMovePreviousItem9.Text = Program.GetLang("pw_PreviousRecord");
		bindingNavigatorMovePreviousItem10.Text = Program.GetLang("pw_PreviousRecord");
		bindingNavigatorMovePreviousItem11.Text = Program.GetLang("pw_PreviousRecord");
		classDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_ClassNo");
		classDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_ClassNo");
		clearButton.Text = Program.GetLang("pw_ClearList");
		clearIn_ToolStripButton.Text = Program.GetLang("pw_Clear") + "<+>";
		clearOrder_ToolStripButton.Text = Program.GetLang("pw_Clear") + "<" + Program.GetLang("pw_Order") + ">";
		clearSP_ToolStripButton.Text = Program.GetLang("pw_Clear") + "<S>";
		clearSpoilage_ToolStripButton.Text = Program.GetLang("pw_Clear") + "<->";
		clearToolStripButton.Text = Program.GetLang("pw_ClearAll");
		cofidDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_RelatedFID");
		coFIDDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_RelatedFID");
		costDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Cost");
		costDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Cost");
		costDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_Cost");
		costDataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_Cost");
		costDataGridViewTextBoxColumn5.HeaderText = Program.GetLang("pw_Cost");
		Data_TabPage.Text = Program.GetLang("pw_Data");
		dataGridViewCheckBoxColumn1.HeaderText = Program.GetLang("pw_Not");
		this.dataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_AndOr");
		DataImport_TabPage.Text = Program.GetLang("pw_Import");
		dateTimeDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_DateTime");
		dateTimeDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_DateTime");
		dateTimeDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_DateTime");
		dateTimeDataGridViewTextBoxColumn5.HeaderText = Program.GetLang("pw_DateTime");
		deptDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_DeptNo");
		deptDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_DeptNo");
		DisplayColumn.HeaderText = Program.GetLang("pw_Expression");
		editTolStripButton.Text = Program.GetLang("pw_Edit");
		editToolStripButton.Text = Program.GetLang("pw_Edit");
		exeButton.Text = Program.GetLang("pw_ExporttoExcelFile");
		exprClearToolStripButton.Text = Program.GetLang("pw_ClearAll");
		fidDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_FID");
		fIDDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_FID");
		fieldColumn.HeaderText = Program.GetLang("pw_FieldName");
		fileButton.Text = Program.GetLang("pw_SelectFile");
		fileNameColumnHeader.Text = Program.GetLang("pw_FileName");
		Filter_TabPage.Text = Program.GetLang("pw_Filter");
		filterButton.Text = Program.GetLang("pw_UpdateFilter");
		filterDoButton.Text = Program.GetLang("pw_DoFilter");
		folderButton.Text = Program.GetLang("pw_Folder");
		fromLabel.Text = Program.GetLang("pw_From");
		gIDDataGridViewComboBoxColumn1.HeaderText = Program.GetLang("pw_StockTable");
		gIDDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_ID");
		groupCheckBox.Text = Program.GetLang("pw_InventoryGroup");
		importButton.Text = Program.GetLang("pw_Import");
		importFile_GroupBox.Text = Program.GetLang("pw_ImportfromFile");
		importRS232_GroupBox.Text = Program.GetLang("pw_ImportfromRS232");
		inAmountDataGridViewTextBoxColumn2.HeaderText = "<+>" + Program.GetLang("pw_AmountBalance");
		inAmountSPDataGridViewTextBoxColumn2.HeaderText = "<S+>" + Program.GetLang("pw_AmountBalance");
		inMoneyDataGridViewTextBoxColumn2.HeaderText = "<+>" + Program.GetLang("pw_MoneyBalance");
		List_TabPage.Text = Program.GetLang("pw_List");
		lowStockDataGridViewCheckBoxColumn2.HeaderText = Program.GetLang("pw_LowStock");
		machineNameColumnHeader.Text = Program.GetLang("pw_MachineName");
		machineNumberColumnHeader.Text = Program.GetLang("pw_MachineNo");
		nameDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_GroupName");
		nameDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_DeviceName");
		nameDataGridViewTextBoxColumn5.HeaderText = Program.GetLang("pw_DeviceName");
		nameDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_TableName");
		openButton.Text = Program.GetLang("pw_UploadReport");
		orderDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_Order");
		pathColumnHeader.Text = Program.GetLang("pw_Path");
		pluCheckBox.Text = Program.GetLang("pw_PLU");
		pLUDataGridViewComboBoxColumn.HeaderText = Program.GetLang("pw_PLUName");
		pLUDataGridViewComboBoxColumn1.HeaderText = Program.GetLang("pw_PLUName");
		pLUDataGridViewComboBoxColumn2.HeaderText = Program.GetLang("pw_PLUName");
		pLUDataGridViewComboBoxColumn2_1.HeaderText = Program.GetLang("pw_PLUName");
		pluDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_PLUNo");
		pLUDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_PLUNo");
		pLUDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_PLUNo");
		pLUDataGridViewTextBoxColumn2_1.HeaderText = Program.GetLang("pw_PLUNo");
		priceDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Money");
		priceDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Money");
		priceDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_Money");
		reCheckBox.Text = Program.GetLang("pw_Re-Upload");
		Report_TabPage.Text = Program.GetLang("pw_Report");
		safetyStockDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_SafetyStock");
		salesmanDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_SalesmanNo");
		salesmanDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_SalesmanNo");
		salesmanDataGridViewTextBoxColumn5.HeaderText = Program.GetLang("pw_SalesmanNo");
		shopNameColumnHeader.Text = Program.GetLang("pw_ShopName");
		sidDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_SID");
		specifyStock_Button.Text = Program.GetLang("pw_SpecifyStock");
		spoilageDataGridViewTextBoxColumn2.HeaderText = "<->" + Program.GetLang("pw_Spoilage");
		spoilageSPDataGridViewTextBoxColumn2.HeaderText = "<S->" + Program.GetLang("pw_Spoilage");
		sTakingTimeDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_LastStocktaking");
		Stock_TabPage.Text = Program.GetLang("pw_Stock");
		stockColumnHeader.Text = Program.GetLang("pw_StockTable");
		stockItemSaveAllToolStripButton.Text = Program.GetLang("pw_SavealltoExcel");
		stockItemSaveToolStripButton.Text = Program.GetLang("pw_SavetoExcel");
		stockSaveAllToolStripButton.Text = Program.GetLang("pw_SavealltoExcel");
		stockSaveToolStripButton.Text = Program.GetLang("pw_SavetoExcel");
		subdirCheckBox.Text = Program.GetLang("pw_IncludeSubFolders");
		subidDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_SubID");
		subIDDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_SubID");
		tableCheckBox.Text = Program.GetLang("pw_Device");
		taxDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Tax");
		taxDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Tax");
		taxDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_Tax");
		taxDataGridViewTextBoxColumn5.HeaderText = Program.GetLang("pw_Tax");
		text1Column1.HeaderText = Program.GetLang("pw_Text1");
		text2Column1.HeaderText = Program.GetLang("pw_Text2");
		text3Column1.HeaderText = Program.GetLang("pw_Text3");
		text4Column1.HeaderText = Program.GetLang("pw_Text4");
		timeColumnHeader.Text = Program.GetLang("pw_DateTime");
		toLabel.Text = Program.GetLang("pw_To");
		typeDataGridViewComboBoxColumn.HeaderText = Program.GetLang("pw_Type");
		typeDataGridViewComboBoxColumn1.HeaderText = Program.GetLang("pw_Type");
		typeDataGridViewComboBoxColumn2.HeaderText = Program.GetLang("pw_Type");
		TypeDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_TypeNo");
		unitDataGridViewComboBoxColumn.HeaderText = Program.GetLang("pw_UnitName");
		unitDataGridViewComboBoxColumn1.HeaderText = Program.GetLang("pw_UnitName");
		unitDataGridViewComboBoxColumn2.HeaderText = Program.GetLang("pw_UnitName");
		unitDataGridViewComboBoxColumn2_1.HeaderText = Program.GetLang("pw_UnitName");
		unitDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_UnitNo");
		unitDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_UnitNo");
		unitDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_UnitNo");
		unitDataGridViewTextBoxColumn2_1.HeaderText = Program.GetLang("pw_UnitNo");
		unitPriceDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_UnitPrice");
		unitPriceDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_UnitPrice");
		unitPriceDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_UnitPrice");
		unitSPDataGridViewComboBoxColumn2.HeaderText = "<S>" + Program.GetLang("pw_Unit");
		unitSPDataGridViewTextBoxColumn2.HeaderText = "<S>" + Program.GetLang("pw_UnitNo");
		subNoDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Accumulated");
		paymentTotalDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_GrandTotal");
		paymentCardDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_CardPay");
		paymentOther1DataGridViewTextBoxColumn1.HeaderText = Program.GetLang_Plus("pw_Payment1");
		paymentOther2DataGridViewTextBoxColumn1.HeaderText = Program.GetLang_Plus("pw_Payment2");
		paymentOther3DataGridViewTextBoxColumn1.HeaderText = Program.GetLang_Plus("pw_Payment3");
		disRoundDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_DisRound");
		sfeeDataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_ServiceFee");
		subNoDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_Accumulated");
		paymentTotalDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_GrandTotal");
		paymentCardDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_CardPay");
		paymentOther1DataGridViewTextBoxColumn2.HeaderText = Program.GetLang_Plus("pw_Payment1");
		paymentOther2DataGridViewTextBoxColumn2.HeaderText = Program.GetLang_Plus("pw_Payment2");
		paymentOther3DataGridViewTextBoxColumn2.HeaderText = Program.GetLang_Plus("pw_Payment3");
		disRoundDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_DisRound");
		sfeeDataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_ServiceFee");
		string fileName = Application.StartupPath + "\\Combo.xml";
		uIDataSet.Report_Col.ReadXml(fileName);
		uIDataSet.SimCombo.ReadXml(fileName);
		string[] array = uIDataSet.SimCombo.FindByName("EPay Type").ValueDisplay.Split('|');
		DataGridViewTextBoxColumn dataGridViewTextBoxColumn = epay0DataGridViewTextBoxColumn1;
		string headerText = (epay0DataGridViewTextBoxColumn2.HeaderText = array[0]);
		dataGridViewTextBoxColumn.HeaderText = headerText;
		if (array.Length >= 2)
		{
			DataGridViewTextBoxColumn dataGridViewTextBoxColumn2 = epay1DataGridViewTextBoxColumn1;
			string headerText2 = (epay1DataGridViewTextBoxColumn2.HeaderText = array[1]);
			dataGridViewTextBoxColumn2.HeaderText = headerText2;
		}
		else
		{
			DataGridViewTextBoxColumn dataGridViewTextBoxColumn3 = epay1DataGridViewTextBoxColumn1;
			string headerText3 = (epay1DataGridViewTextBoxColumn2.HeaderText = "");
			dataGridViewTextBoxColumn3.HeaderText = headerText3;
		}
		if (array.Length >= 3)
		{
			DataGridViewTextBoxColumn dataGridViewTextBoxColumn4 = epay2DataGridViewTextBoxColumn1;
			string headerText4 = (epay2DataGridViewTextBoxColumn2.HeaderText = array[2]);
			dataGridViewTextBoxColumn4.HeaderText = headerText4;
		}
		else
		{
			DataGridViewTextBoxColumn dataGridViewTextBoxColumn5 = epay2DataGridViewTextBoxColumn1;
			string headerText5 = (epay2DataGridViewTextBoxColumn2.HeaderText = "");
			dataGridViewTextBoxColumn5.HeaderText = headerText5;
		}
		if (array.Length >= 4)
		{
			DataGridViewTextBoxColumn dataGridViewTextBoxColumn6 = epay3DataGridViewTextBoxColumn1;
			string headerText6 = (epay3DataGridViewTextBoxColumn2.HeaderText = array[3]);
			dataGridViewTextBoxColumn6.HeaderText = headerText6;
		}
		else
		{
			DataGridViewTextBoxColumn dataGridViewTextBoxColumn7 = epay3DataGridViewTextBoxColumn1;
			string headerText7 = (epay3DataGridViewTextBoxColumn2.HeaderText = "");
			dataGridViewTextBoxColumn7.HeaderText = headerText7;
		}
		if (array.Length >= 5)
		{
			DataGridViewTextBoxColumn dataGridViewTextBoxColumn8 = epay4DataGridViewTextBoxColumn1;
			string headerText8 = (epay4DataGridViewTextBoxColumn2.HeaderText = array[4]);
			dataGridViewTextBoxColumn8.HeaderText = headerText8;
		}
		else
		{
			DataGridViewTextBoxColumn dataGridViewTextBoxColumn9 = epay4DataGridViewTextBoxColumn1;
			string headerText9 = (epay4DataGridViewTextBoxColumn2.HeaderText = "");
			dataGridViewTextBoxColumn9.HeaderText = headerText9;
		}
		if (array.Length >= 6)
		{
			DataGridViewTextBoxColumn dataGridViewTextBoxColumn10 = epay5DataGridViewTextBoxColumn1;
			string headerText10 = (epay5DataGridViewTextBoxColumn2.HeaderText = array[5]);
			dataGridViewTextBoxColumn10.HeaderText = headerText10;
		}
		else
		{
			DataGridViewTextBoxColumn dataGridViewTextBoxColumn11 = epay5DataGridViewTextBoxColumn1;
			string headerText11 = (epay5DataGridViewTextBoxColumn2.HeaderText = "");
			dataGridViewTextBoxColumn11.HeaderText = headerText11;
		}
		if (array.Length >= 7)
		{
			DataGridViewTextBoxColumn dataGridViewTextBoxColumn12 = epay6DataGridViewTextBoxColumn1;
			string headerText12 = (epay6DataGridViewTextBoxColumn2.HeaderText = array[6]);
			dataGridViewTextBoxColumn12.HeaderText = headerText12;
		}
		else
		{
			DataGridViewTextBoxColumn dataGridViewTextBoxColumn13 = epay6DataGridViewTextBoxColumn1;
			string headerText13 = (epay6DataGridViewTextBoxColumn2.HeaderText = "");
			dataGridViewTextBoxColumn13.HeaderText = headerText13;
		}
		if (array.Length >= 8)
		{
			DataGridViewTextBoxColumn dataGridViewTextBoxColumn14 = epay7DataGridViewTextBoxColumn1;
			string headerText14 = (epay7DataGridViewTextBoxColumn2.HeaderText = array[7]);
			dataGridViewTextBoxColumn14.HeaderText = headerText14;
		}
		else
		{
			DataGridViewTextBoxColumn dataGridViewTextBoxColumn15 = epay7DataGridViewTextBoxColumn1;
			string headerText15 = (epay7DataGridViewTextBoxColumn2.HeaderText = "");
			dataGridViewTextBoxColumn15.HeaderText = headerText15;
		}
		DataGridViewTextBoxColumn dataGridViewTextBoxColumn16 = epay0DataGridViewTextBoxColumn1;
		bool visible = (epay0DataGridViewTextBoxColumn2.Visible = epay0DataGridViewTextBoxColumn1.HeaderText != "");
		dataGridViewTextBoxColumn16.Visible = visible;
		DataGridViewTextBoxColumn dataGridViewTextBoxColumn17 = epay1DataGridViewTextBoxColumn1;
		bool visible2 = (epay1DataGridViewTextBoxColumn2.Visible = epay1DataGridViewTextBoxColumn1.HeaderText != "");
		dataGridViewTextBoxColumn17.Visible = visible2;
		DataGridViewTextBoxColumn dataGridViewTextBoxColumn18 = epay2DataGridViewTextBoxColumn1;
		bool visible3 = (epay2DataGridViewTextBoxColumn2.Visible = epay2DataGridViewTextBoxColumn1.HeaderText != "");
		dataGridViewTextBoxColumn18.Visible = visible3;
		DataGridViewTextBoxColumn dataGridViewTextBoxColumn19 = epay3DataGridViewTextBoxColumn1;
		bool visible4 = (epay3DataGridViewTextBoxColumn2.Visible = epay3DataGridViewTextBoxColumn1.HeaderText != "");
		dataGridViewTextBoxColumn19.Visible = visible4;
		DataGridViewTextBoxColumn dataGridViewTextBoxColumn20 = epay4DataGridViewTextBoxColumn1;
		bool visible5 = (epay4DataGridViewTextBoxColumn2.Visible = epay4DataGridViewTextBoxColumn1.HeaderText != "");
		dataGridViewTextBoxColumn20.Visible = visible5;
		DataGridViewTextBoxColumn dataGridViewTextBoxColumn21 = epay5DataGridViewTextBoxColumn1;
		bool visible6 = (epay5DataGridViewTextBoxColumn2.Visible = epay5DataGridViewTextBoxColumn1.HeaderText != "");
		dataGridViewTextBoxColumn21.Visible = visible6;
		DataGridViewTextBoxColumn dataGridViewTextBoxColumn22 = epay6DataGridViewTextBoxColumn1;
		bool visible7 = (epay6DataGridViewTextBoxColumn2.Visible = epay6DataGridViewTextBoxColumn1.HeaderText != "");
		dataGridViewTextBoxColumn22.Visible = visible7;
		DataGridViewTextBoxColumn dataGridViewTextBoxColumn23 = epay7DataGridViewTextBoxColumn1;
		bool visible8 = (epay7DataGridViewTextBoxColumn2.Visible = epay7DataGridViewTextBoxColumn1.HeaderText != "");
		dataGridViewTextBoxColumn23.Visible = visible8;
		if (Settings.Default.gen_dtType_Date != "")
		{
			DateTimePicker dateTimePicker = fromDatePicker;
			string customFormat = (toDatePicker.CustomFormat = Settings.Default.gen_dtType_Date);
			dateTimePicker.CustomFormat = customFormat;
			DateTimePicker dateTimePicker2 = fromDatePicker;
			DateTimePickerFormat format = (toDatePicker.Format = DateTimePickerFormat.Custom);
			dateTimePicker2.Format = format;
		}
		if (Settings.Default.gen_dtType_Time != "")
		{
			DateTimePicker dateTimePicker3 = fromTimePicker;
			string customFormat2 = (toTimePicker.CustomFormat = Settings.Default.gen_dtType_Time);
			dateTimePicker3.CustomFormat = customFormat2;
			DateTimePicker dateTimePicker4 = fromTimePicker;
			DateTimePickerFormat format2 = (toTimePicker.Format = DateTimePickerFormat.Custom);
			dateTimePicker4.Format = format2;
		}
		Font = Settings.Default.CustomFont;
		filterDoButton.Font = new Font(filterDoButton.Font, FontStyle.Bold);
		sGroupTableAdapter.Fill(reportDataSet.SGroup);
		deviceTableAdapter.Fill(reportDataSet.Device);
		DataSet_OK = true;
		RDS.DataSet_Init_Unit(ref ecsDataSet);
		DataSet_Refresh_Do("Report_Dock", always: true);
		DataSet_Refresh_Do("Report", always: true);
		DataSet_Refresh_Do("PLU", always: true);
		stringTableAdapter.Fill(ecsDataSet.String);
		exprTableAdapter.Fill(reportDataSet.Expr);
		excelTableAdapter.Fill(reportDataSet.Excel);
		string[] array2 = uIDataSet.SimCombo.FindByName("PLU Default").ValueDisplay.Split('|');
		pluDefault = new SimComboVD_No[array2.Length / 2];
		for (int i = 0; i < array2.Length / 2; i++)
		{
			SimComboVD_No simComboVD_No = new SimComboVD_No();
			simComboVD_No.Value = int.Parse(array2[i * 2]);
			simComboVD_No.Display = array2[i * 2 + 1];
			pluDefault[i] = simComboVD_No;
		}
		rLogsTypeTableAdapter.Fill(reportDataSet.rLogsType);
		rStockTypeTableAdapter.Fill(reportDataSet.rStockType);
		DataGridViewCellStyle defaultCellStyle = inMoneyDataGridViewTextBoxColumn4.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle2 = unitPriceDataGridViewTextBoxColumn3.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle3 = priceDataGridViewTextBoxColumn3.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle4 = priceDataGridViewTextBoxColumn.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle5 = priceDataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle6 = costDataGridViewTextBoxColumn.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle7 = costDataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle8 = costDataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle9 = costDataGridViewTextBoxColumn3.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle10 = costDataGridViewTextBoxColumn5.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle11 = taxDataGridViewTextBoxColumn.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle12 = taxDataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle13 = taxDataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle14 = taxDataGridViewTextBoxColumn5.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle15 = unitDataGridViewTextBoxColumn.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle16 = unitPriceDataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle17 = unitPriceDataGridViewTextBoxColumn.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle18 = priceDataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle19 = inMoneyDataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle20 = paymentTotalDataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle21 = paymentCardDataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle22 = paymentOther1DataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle23 = paymentOther2DataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle24 = paymentOther3DataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle25 = disRoundDataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle26 = sfeeDataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle27 = paymentTotalDataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle28 = paymentCardDataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle29 = paymentOther1DataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle30 = paymentOther2DataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle31 = paymentOther3DataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle32 = disRoundDataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle33 = sfeeDataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle34 = epay0DataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle35 = epay0DataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle36 = epay1DataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle37 = epay1DataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle38 = epay2DataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle39 = epay2DataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle40 = epay3DataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle41 = epay3DataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle42 = epay4DataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle43 = epay4DataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle44 = epay5DataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle45 = epay5DataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle46 = epay6DataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle47 = epay6DataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle48 = epay7DataGridViewTextBoxColumn1.DefaultCellStyle;
		string text17 = (epay7DataGridViewTextBoxColumn2.DefaultCellStyle.Format = "F" + Settings.Default.Format_Price);
		string text19 = (defaultCellStyle48.Format = text17);
		string text21 = (defaultCellStyle47.Format = text19);
		string text23 = (defaultCellStyle46.Format = text21);
		string text25 = (defaultCellStyle45.Format = text23);
		string text27 = (defaultCellStyle44.Format = text25);
		string text29 = (defaultCellStyle43.Format = text27);
		string text31 = (defaultCellStyle42.Format = text29);
		string text33 = (defaultCellStyle41.Format = text31);
		string text35 = (defaultCellStyle40.Format = text33);
		string text37 = (defaultCellStyle39.Format = text35);
		string text39 = (defaultCellStyle38.Format = text37);
		string text41 = (defaultCellStyle37.Format = text39);
		string text43 = (defaultCellStyle36.Format = text41);
		string text45 = (defaultCellStyle35.Format = text43);
		string text47 = (defaultCellStyle34.Format = text45);
		string text49 = (defaultCellStyle33.Format = text47);
		string text51 = (defaultCellStyle32.Format = text49);
		string text53 = (defaultCellStyle31.Format = text51);
		string text55 = (defaultCellStyle30.Format = text53);
		string text57 = (defaultCellStyle29.Format = text55);
		string text59 = (defaultCellStyle28.Format = text57);
		string text61 = (defaultCellStyle27.Format = text59);
		text = (defaultCellStyle26.Format = text61);
		text = (defaultCellStyle25.Format = text);
		text = (defaultCellStyle24.Format = text);
		text = (defaultCellStyle23.Format = text);
		text = (defaultCellStyle22.Format = text);
		text = (defaultCellStyle21.Format = text);
		text = (defaultCellStyle20.Format = text);
		text = (defaultCellStyle19.Format = text);
		text = (defaultCellStyle18.Format = text);
		text = (defaultCellStyle17.Format = text);
		text = (defaultCellStyle16.Format = text);
		text = (defaultCellStyle15.Format = text);
		text = (defaultCellStyle14.Format = text);
		text = (defaultCellStyle13.Format = text);
		text = (defaultCellStyle12.Format = text);
		text = (defaultCellStyle11.Format = text);
		text = (defaultCellStyle10.Format = text);
		text = (defaultCellStyle9.Format = text);
		text = (defaultCellStyle8.Format = text);
		text = (defaultCellStyle7.Format = text);
		text = (defaultCellStyle6.Format = text);
		text = (defaultCellStyle5.Format = text);
		text = (defaultCellStyle4.Format = text);
		text = (defaultCellStyle3.Format = text);
		text = (defaultCellStyle2.Format = text);
		defaultCellStyle.Format = text;
		DataGridViewCellStyle defaultCellStyle49 = amountDataGridViewTextBoxColumn4.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle50 = inAmountDataGridViewTextBoxColumn4.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle51 = safetyStockDataGridViewTextBoxColumn4.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle52 = orderDataGridViewTextBoxColumn4.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle53 = spoilageDataGridViewTextBoxColumn4.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle54 = amountDataGridViewTextBoxColumn3.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle55 = amountDataGridViewTextBoxColumn.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle56 = amountDataGridViewTextBoxColumn1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle57 = amountDataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle58 = amountDataGridViewTextBoxColumn2_1.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle59 = amountSPDataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle60 = inAmountDataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle61 = inAmountSPDataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle62 = spoilageDataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle63 = spoilageSPDataGridViewTextBoxColumn2.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle64 = safetyStockDataGridViewTextBoxColumn2.DefaultCellStyle;
		text = (orderDataGridViewTextBoxColumn2.DefaultCellStyle.Format = "F" + Settings.Default.Format_Weight);
		text = (defaultCellStyle64.Format = text);
		text = (defaultCellStyle63.Format = text);
		text = (defaultCellStyle62.Format = text);
		text = (defaultCellStyle61.Format = text);
		text = (defaultCellStyle60.Format = text);
		text = (defaultCellStyle59.Format = text);
		text = (defaultCellStyle58.Format = text);
		text = (defaultCellStyle57.Format = text);
		text = (defaultCellStyle56.Format = text);
		text = (defaultCellStyle55.Format = text);
		text = (defaultCellStyle54.Format = text);
		text = (defaultCellStyle53.Format = text);
		text = (defaultCellStyle52.Format = text);
		text = (defaultCellStyle51.Format = text);
		text = (defaultCellStyle50.Format = text);
		defaultCellStyle49.Format = text;
		if (Settings.Default.gen_dtType_Date != "" && Settings.Default.gen_dtType_Time != "")
		{
			DataGridViewCellStyle defaultCellStyle65 = kIDTimeDataGridViewTextBoxColumn4.DefaultCellStyle;
			DataGridViewCellStyle defaultCellStyle66 = dateTimeDataGridViewTextBoxColumn3.DefaultCellStyle;
			DataGridViewCellStyle defaultCellStyle67 = dateTimeDataGridViewTextBoxColumn.DefaultCellStyle;
			DataGridViewCellStyle defaultCellStyle68 = dateTimeDataGridViewTextBoxColumn1.DefaultCellStyle;
			DataGridViewCellStyle defaultCellStyle69 = dateTimeDataGridViewTextBoxColumn2.DefaultCellStyle;
			text = (sTakingTimeDataGridViewTextBoxColumn2.DefaultCellStyle.Format = Settings.Default.gen_dtType_Date + " " + Settings.Default.gen_dtType_Time);
			text = (defaultCellStyle69.Format = text);
			text = (defaultCellStyle68.Format = text);
			text = (defaultCellStyle67.Format = text);
			text = (defaultCellStyle66.Format = text);
			defaultCellStyle65.Format = text;
			sTakingTimeDataGridViewTextBoxColumn4.DefaultCellStyle.Format = Settings.Default.gen_dtType_Date;
		}
		else
		{
			DataGridViewCellStyle defaultCellStyle70 = kIDTimeDataGridViewTextBoxColumn4.DefaultCellStyle;
			DataGridViewCellStyle defaultCellStyle71 = dateTimeDataGridViewTextBoxColumn3.DefaultCellStyle;
			DataGridViewCellStyle defaultCellStyle72 = dateTimeDataGridViewTextBoxColumn.DefaultCellStyle;
			DataGridViewCellStyle defaultCellStyle73 = dateTimeDataGridViewTextBoxColumn1.DefaultCellStyle;
			DataGridViewCellStyle defaultCellStyle74 = dateTimeDataGridViewTextBoxColumn2.DefaultCellStyle;
			text = (sTakingTimeDataGridViewTextBoxColumn2.DefaultCellStyle.Format = "yyyy.MM.dd HH:mm:ss");
			text = (defaultCellStyle74.Format = text);
			text = (defaultCellStyle73.Format = text);
			text = (defaultCellStyle72.Format = text);
			text = (defaultCellStyle71.Format = text);
			defaultCellStyle70.Format = text;
			sTakingTimeDataGridViewTextBoxColumn4.DefaultCellStyle.Format = "yyyy.MM.dd";
		}
		serialComboBox.Items.AddRange(SerialPort.GetPortNames());
		baudComboBox.Text = Settings.Default.serailBaudRate.ToString();
		serialComboBox.SelectedIndex = ((serialComboBox.Items.Count <= 0) ? (-1) : 0);
		using (OleDbConnection conn = new OleDbConnection(Settings.Default.ReportConnectionString))
		{
			copyPUtable(conn);
		}
		UpdateFolderUI();
		DateTime now = DateTime.Now;
		fromTimePicker.Value = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0);
		toTimePicker.Value = new DateTime(now.Year, now.Month, now.Day, 23, 59, 59);
		groupComboBox.SelectedValue = 1;
		FormLoad_OK = true;
		opComboBox.SelectedIndex = 0;
	}

	private void ReportForm_FormClosed(object sender, FormClosedEventArgs e)
	{
		Validate();
		try
		{
			deviceBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			deviceBindingSource.CancelEdit();
		}
		try
		{
			sGroupBindingSource.EndEdit();
		}
		catch (Exception ex2)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			sGroupBindingSource.CancelEdit();
		}
		try
		{
			logBindingSource.EndEdit();
		}
		catch (Exception ex3)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex3.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			logBindingSource.CancelEdit();
		}
		try
		{
			logItemBindingSource.EndEdit();
		}
		catch (Exception ex4)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex4.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			logItemBindingSource.CancelEdit();
		}
		try
		{
			exprBindingSource.EndEdit();
		}
		catch (Exception ex5)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex5.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			exprBindingSource.CancelEdit();
		}
		try
		{
			excelBindingSource.EndEdit();
		}
		catch (Exception ex6)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex6.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			excelBindingSource.CancelEdit();
		}
		if (reportDataSet.HasChanges())
		{
			try
			{
				exprTableAdapter.Update(reportDataSet.Expr);
				excelTableAdapter.Update(reportDataSet.Excel);
			}
			catch (Exception ex7)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex7.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void OpenFromFile(string fileName)
	{
		string machineName;
		string machineNumber;
		string time;
		string mac;
		string mac_o;
		string shopName = (machineName = (machineNumber = (time = (mac = (mac_o = "")))));
		GetInfo(fileName, out shopName, out machineName, out machineNumber, out time, out mac, out mac_o, out var nVersion);
		if (mac.Length == 0)
		{
			return;
		}
		ReportDataSet.DeviceRow deviceRow = RDS.reportDataSet.Device.FindByMAC(mac);
		if (deviceRow == null)
		{
			return;
		}
		ReportDataSet.SGroupRow sGroupRow = RDS.reportDataSet.SGroup.FindByGID(deviceRow.GID);
		if (sGroupRow == null)
		{
			return;
		}
		deviceRow.Name = '★' + shopName + '★' + machineName + '★' + machineNumber.ToString();
		if (string.IsNullOrEmpty(fileName) || !File.Exists(fileName))
		{
			return;
		}
		try
		{
			string[] lines = File.ReadAllLines(fileName, Program.GetEncoding());
			if (RDS.NL_Log_Get(mac, "", lines, out var error, out var success, string.Compare(nVersion, "V3.00A") < 0 || !Settings.Default.gen_CostFromDevice))
			{
				UploadReport_Log_Info(success);
			}
			else
			{
				UploadReport_Log_Error(error);
			}
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void dataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void editToolStripButton_Click(object sender, EventArgs e)
	{
		exprDataGridView.EndEdit();
		if (exprBindingSource.Position < 0 || !(exprBindingSource.Current is DataRowView { Row: ReportDataSet.ExprRow row }))
		{
			return;
		}
		using ExprForm exprForm = new ExprForm();
		exprForm.ExprRow = row;
		row.BeginEdit();
		if (exprForm.ShowDialog(this) == DialogResult.OK)
		{
			NeedFilter();
			row.EndEdit();
		}
		else
		{
			row.CancelEdit();
		}
	}

	private void FilterLog()
	{
		try
		{
			exprDataGridView.EndEdit();
			Cursor.Current = Cursors.WaitCursor;
			resultLogItemTableAdapter.SetFilter(GetFilter_LogItem());
			resultLogItemTableAdapter.Fill(reportDataSet.ResultLogItem);
			string filter_Log = GetFilter_Log();
			resultLogTableAdapter.SetFilter(filter_Log);
			resultLogTableAdapter.Fill(reportDataSet.ResultLog);
			splitContainer5.Panel1Collapsed = filter_Log == "FALSE";
			decimal num = 0m;
			decimal num2 = 0m;
			string value = string.Empty;
			string value2 = string.Empty;
			foreach (ReportDataSet.ResultLogItemRow item in reportDataSet.ResultLogItem)
			{
				ECSDataSet.UnitRow unitRow = ecsDataSet.Unit.FindByUnitID(item.Unit);
				if (unitRow == null)
				{
					continue;
				}
				if (unitRow.Punit == 1)
				{
					if (num2 == 0m)
					{
						value2 = unitRow.Name;
						num2 = unitRow.Pack;
						item.Weight = item.Amount;
						item.Count = 0m;
					}
					else
					{
						item.Weight = item.Amount * unitRow.Pack / num2;
						item.Count = 0m;
					}
				}
				else if (num == 0m)
				{
					value = unitRow.Name;
					num = unitRow.Pack;
					item.Count = item.Amount;
					item.Weight = 0m;
				}
				else
				{
					item.Count = item.Amount * unitRow.Pack / num;
					item.Weight = 0m;
				}
			}
			string filterDisplay = GetFilterDisplay();
			string[] array = uIDataSet.SimCombo.FindByName("Report Title").ValueDisplay.Split('|');
			array[16] = string.Format(array[16], Program.GetLang_Plus("pw_Payment1"));
			array[17] = string.Format(array[17], Program.GetLang_Plus("pw_Payment2"));
			array[18] = string.Format(array[18], Program.GetLang_Plus("pw_Payment3"));
			array[31] = ((epay0DataGridViewTextBoxColumn1.HeaderText == "") ? "false" : string.Format(array[31], epay0DataGridViewTextBoxColumn1.HeaderText));
			array[32] = ((epay1DataGridViewTextBoxColumn1.HeaderText == "") ? "false" : string.Format(array[32], epay1DataGridViewTextBoxColumn1.HeaderText));
			array[33] = ((epay2DataGridViewTextBoxColumn1.HeaderText == "") ? "false" : string.Format(array[33], epay2DataGridViewTextBoxColumn1.HeaderText));
			array[34] = ((epay3DataGridViewTextBoxColumn1.HeaderText == "") ? "false" : string.Format(array[34], epay3DataGridViewTextBoxColumn1.HeaderText));
			array[35] = ((epay4DataGridViewTextBoxColumn1.HeaderText == "") ? "false" : string.Format(array[35], epay4DataGridViewTextBoxColumn1.HeaderText));
			array[36] = ((epay5DataGridViewTextBoxColumn1.HeaderText == "") ? "false" : string.Format(array[36], epay5DataGridViewTextBoxColumn1.HeaderText));
			array[37] = ((epay6DataGridViewTextBoxColumn1.HeaderText == "") ? "false" : string.Format(array[37], epay6DataGridViewTextBoxColumn1.HeaderText));
			array[38] = ((epay7DataGridViewTextBoxColumn1.HeaderText == "") ? "false" : string.Format(array[38], epay7DataGridViewTextBoxColumn1.HeaderText));
			string[] array2 = uIDataSet.SimCombo.FindByName("Logs Type Sim").ValueDisplay.Split('|');
			string[] array3 = new string[array2.Length + 100];
			int i;
			for (i = 0; i < array2.Length; i++)
			{
				array3[i] = array2[i];
				array3[i + 100] = array2[i] + "(PC)";
			}
			for (; i < 100; i++)
			{
				array3[i] = "SP" + i.ToString("00");
			}
			_ = ecsDataSet.String.FindByStringID(2).Value;
			_ = ecsDataSet.String.FindByStringID(3).Value;
			ReportParameter reportParameter = new ReportParameter("Display", filterDisplay);
			ReportParameter reportParameter2 = new ReportParameter("Unit_Count", value);
			ReportParameter reportParameter3 = new ReportParameter("Unit_Weight", value2);
			ReportParameter reportParameter4 = new ReportParameter("Format_Count", "F0");
			ReportParameter reportParameter5 = new ReportParameter("Format_Weight", "F" + Settings.Default.Format_Weight);
			ReportParameter reportParameter6 = new ReportParameter("Format_Price", "F" + Settings.Default.Format_Price);
			ReportParameter reportParameter7 = new ReportParameter("Report_Type", array3);
			ReportParameter reportParameter8 = new ReportParameter("Title", array);
			using (OleDbConnection conn = new OleDbConnection(Settings.Default.ReportConnectionString))
			{
				copyPUtable(conn);
			}
			reportViewer1.LocalReport.SetParameters(new ReportParameter[8] { reportParameter, reportParameter2, reportParameter3, reportParameter4, reportParameter5, reportParameter6, reportParameter7, reportParameter8 });
			reportViewer1.RefreshReport();
		}
		finally
		{
			Cursor.Current = Cursors.Default;
			filterDoButton.Enabled = false;
		}
	}

	private string GetFilterDisplay()
	{
		string result = string.Empty;
		if (exprBindingSource.Count > 0)
		{
			StringBuilder stringBuilder = new StringBuilder();
			DataRowView dataRowView = exprBindingSource[0] as DataRowView;
			ReportDataSet.ExprRow exprRow = dataRowView.Row as ReportDataSet.ExprRow;
			stringBuilder.AppendFormat("{0}( {1} )\n", exprRow.Not ? "NOT " : string.Empty, exprRow.Display);
			for (int i = 1; i < exprBindingSource.Count; i++)
			{
				dataRowView = exprBindingSource[i] as DataRowView;
				exprRow = dataRowView.Row as ReportDataSet.ExprRow;
				stringBuilder.AppendFormat("{0} {1}( {2} )\n", exprRow.AndOr, exprRow.Not ? "NOT " : string.Empty, exprRow.Display);
			}
			result = stringBuilder.ToString();
		}
		return result;
	}

	private string GetUnitName(int unit)
	{
		ECSDataSet.UnitRow unitRow = ecsDataSet.Unit.FindByUnitID(unit);
		if (unitRow != null)
		{
			return unitRow.Name;
		}
		return string.Empty;
	}

	private string GetPLUName(int plu)
	{
		ECSDataSet.PLURow pLURow = ecsDataSet.PLU.FindByPLUID(plu);
		if (pLURow != null)
		{
			return pLURow.Name;
		}
		for (int i = 0; i < pluDefault.Length; i++)
		{
			if (pluDefault[i].Value == plu)
			{
				return pluDefault[i].Display;
			}
		}
		return string.Empty;
	}

	private string GetFilter_LogItem()
	{
		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.AppendFormat("[Device].GID >= 1");
		for (int i = 0; i < exprBindingSource.Count; i++)
		{
			if (!(exprBindingSource[i] is DataRowView dataRowView))
			{
				return "TRUE";
			}
			if (!(dataRowView.Row is ReportDataSet.ExprRow exprRow))
			{
				return "TRUE";
			}
			stringBuilder.AppendFormat(" {0} {1}( {2} )", (i == 0) ? "AND" : exprRow.AndOr, exprRow.Not ? "NOT " : string.Empty, GetExpression(exprRow));
		}
		return stringBuilder.ToString();
	}

	private string GetFilter_Log()
	{
		for (int i = 0; i < exprBindingSource.Count; i++)
		{
			if (!(exprBindingSource[i] is DataRowView dataRowView))
			{
				return "TRUE";
			}
			if (!(dataRowView.Row is ReportDataSet.ExprRow exprRow))
			{
				return "TRUE";
			}
			switch (exprRow.Field)
			{
			case "[Device].[GID]":
			case "[SGroup].[Name]":
			case "[Device].[MAC]":
			case "[Device].[Name]":
			case "[Log].[DateTime]":
			case "[Log].[FID]":
			case "[Log].[SID]":
			case "[Log].[Salesman]":
				continue;
			}
			return "FALSE";
		}
		return GetFilter_LogItem();
	}

	private string GetExpression(ReportDataSet.ExprRow exprRow)
	{
		switch (exprRow.Field)
		{
		case "[Device].[GID]":
			return $"[Device].[GID] = {exprRow.Expr1}";
		case "[Device].[MAC]":
			return $"[Log].[MAC] = '{exprRow.Expr1}'";
		case "[LogItem].[Type]":
			return $"[LogItem].[Type] = {exprRow.Expr1}";
		case "[Log].[DateTime]":
			return $"[Log].[DateTime] BETWEEN #{exprRow.Expr1}# AND #{exprRow.Expr2}#";
		default:
			switch (exprRow.Field)
			{
			case "[LogItem].[Amount]":
				_ = Settings.Default.Format_Weight;
				break;
			case "[LogItem].[Price]":
			case "[LogItem].[Cost]":
			case "[LogItem].[Tax]":
			case "[LogItem].[UnitPrice]":
				_ = Settings.Default.Format_Price;
				break;
			}
			if (exprRow.Op == "BETWEEN")
			{
				return $"{exprRow.Field} BETWEEN {exprRow.Expr1} AND {exprRow.Expr2}";
			}
			return $"{exprRow.Field} {exprRow.Op} {exprRow.Expr1}";
		}
	}

	private void exprDataGridView_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
	{
		if (e.ColumnIndex == 2)
		{
			editToolStripButton_Click(sender, e);
		}
	}

	private void clearToolStripButton_Click(object sender, EventArgs e)
	{
		foreach (DataRowView item in exprBindingSource)
		{
			item.Row.Delete();
		}
		NeedFilter();
		exprTableAdapter.Update(reportDataSet.Expr);
	}

	private string GetField(string field, string display)
	{
		if (field.Length == 0)
		{
			return string.Empty;
		}
		switch (field)
		{
		case "[LogItem].[Reject]":
			return $"IIF({field}, 1, 0) AS [{display}]";
		case "[LogItem].[Price]":
		case "[LogItem].[Cost]":
		case "[LogItem].[Tax]":
		case "[LogItem].[Amount]":
		case "[LogItem].[UnitPrice]":
			return $"CDbl({field}) AS [{display}]";
		default:
			return $"{field} AS [{display}]";
		}
	}

	private void copyPUtable(OleDbConnection conn)
	{
		if (!NeedCopyPU)
		{
			return;
		}
		NeedCopyPU = false;
		conn.Open();
		OleDbCommand oleDbCommand;
		try
		{
			oleDbCommand = new OleDbCommand("drop table rPLU", conn);
			oleDbCommand.ExecuteNonQuery();
		}
		catch (Exception)
		{
		}
		try
		{
			oleDbCommand = new OleDbCommand("drop table rUnit", conn);
			oleDbCommand.ExecuteNonQuery();
		}
		catch (Exception)
		{
		}
		string cmdText = "SELECT * into rPLU FROM [" + Application.StartupPath + "\\ECS.mdb;pwd=showmethemoney].PLU";
		oleDbCommand = new OleDbCommand(cmdText, conn);
		oleDbCommand.ExecuteNonQuery();
		cmdText = "SELECT * into rUnit FROM [" + Application.StartupPath + "\\ECS.mdb;pwd=showmethemoney].Unit";
		oleDbCommand = new OleDbCommand(cmdText, conn);
		oleDbCommand.ExecuteNonQuery();
		conn.Close();
		rPLUTableAdapter.ClearBeforeFill = true;
		rPLUTableAdapter.Fill(reportDataSet.rPLU);
		string[] array = uIDataSet.SimCombo.FindByName("PLU Default").ValueDisplay.Split('|');
		pluDefault = new SimComboVD_No[array.Length / 2];
		for (int i = 0; i < array.Length / 2; i++)
		{
			int num = int.Parse(array[i * 2]);
			if (reportDataSet.rPLU.FindByPLUID(num) == null)
			{
				ReportDataSet.rPLURow rPLURow = reportDataSet.rPLU.NewrPLURow();
				rPLURow.PLUID = num;
				rPLURow.Name = array[i * 2 + 1];
				if (num == 9999999)
				{
					rPLURow.UnitID = 1;
				}
				else
				{
					rPLURow.UnitID = 2;
				}
				reportDataSet.rPLU.AddrPLURow(rPLURow);
			}
		}
		rPLUTableAdapter.Update(reportDataSet.rPLU);
	}

	private void SaveToExcel(string filename)
	{
		try
		{
			if (File.Exists(filename))
			{
				File.Delete(filename);
			}
			string empty = string.Empty;
			string text = string.Empty;
			string display = string.Empty;
			int i;
			for (i = 0; i < excelBindingSource.Count; i++)
			{
				DataRowView dataRowView = (DataRowView)excelBindingSource[i];
				ReportDataSet.ExcelRow excelRow = (ReportDataSet.ExcelRow)dataRowView.Row;
				text = excelRow.Field;
				if (!string.IsNullOrEmpty(text))
				{
					display = uIDataSet.Report_Col.FindByField(text).Display;
					break;
				}
			}
			if (i == excelBindingSource.Count)
			{
				return;
			}
			empty += GetField(text, display);
			for (int j = i + 1; j < excelBindingSource.Count; j++)
			{
				DataRowView dataRowView = (DataRowView)excelBindingSource[j];
				ReportDataSet.ExcelRow excelRow = (ReportDataSet.ExcelRow)dataRowView.Row;
				text = excelRow.Field;
				display = uIDataSet.Report_Col.FindByField(text).Display;
				if (!string.IsNullOrEmpty(text))
				{
					display = uIDataSet.Report_Col.FindByField(text).Display;
					empty = empty + ", " + GetField(text, display);
				}
			}
			Cursor.Current = Cursors.WaitCursor;
			using (OleDbConnection oleDbConnection = new OleDbConnection(Settings.Default.ReportConnectionString))
			{
				copyPUtable(oleDbConnection);
				oleDbConnection.Open();
				OleDbCommand oleDbCommand = new OleDbCommand();
				oleDbCommand.Connection = oleDbConnection;
				string filter_LogItem = GetFilter_LogItem();
				oleDbCommand.CommandText = $"SELECT {empty} INTO [Excel 8.0;Database={filename}].[Sheet1] FROM ((((([Log] INNER JOIN [LogItem] ON ([Log].[MAC] = [LogItem].[MAC] AND [Log].[FID] = [LogItem].[FID])) INNER JOIN [Device] ON Log.MAC = [Device].MAC) INNER JOIN [SGroup] ON [SGroup].GID = [Device].GID) LEFT JOIN [rPLU] ON [LogItem].[PLU] = [rPLU].[PLUID])LEFT JOIN [rUnit] ON [LogItem].[Unit] = [rUnit].[UnitID])WHERE {filter_LogItem} ORDER BY [LogItem].[MAC], [LogItem].[FID], [LogItem].[SubID]";
				oleDbCommand.ExecuteNonQuery();
				oleDbConnection.Close();
			}
			MessageBox.Show(this, Program.GetLang("pw_OperationSuccess"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
			base.DialogResult = DialogResult.OK;
			Process.Start(filename);
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
		finally
		{
			Cursor.Current = Cursors.Default;
		}
	}

	private void exeButton_Click(object sender, EventArgs e)
	{
		if (excelBindingSource.Count > 0)
		{
			SaveFileDialog saveFileDialog = new SaveFileDialog();
			saveFileDialog.Title = Program.GetLang("pw_ExporttoExcelFile");
			saveFileDialog.OverwritePrompt = true;
			saveFileDialog.Filter = Program.GetLang("pw_ExcelFile___XLS____xls");
			if (saveFileDialog.ShowDialog(this) == DialogResult.OK)
			{
				SaveToExcel(saveFileDialog.FileName);
			}
		}
	}

	private void excelClearToolStripButton_Click(object sender, EventArgs e)
	{
		foreach (DataRowView item in excelBindingSource)
		{
			item.Row.Delete();
		}
		excelTableAdapter.Update(reportDataSet.Excel);
	}

	private void addAllToolStripButton_Click(object sender, EventArgs e)
	{
		foreach (DataRowView item in excelBindingSource)
		{
			item.Row.Delete();
		}
		foreach (UIDataSet.Report_ColRow item2 in uIDataSet.Report_Col)
		{
			string field = item2.Field;
			if (field.Length > 0)
			{
				reportDataSet.Excel.AddExcelRow(field);
			}
		}
		excelTableAdapter.Update(reportDataSet.Excel);
	}

	private string GetDisplayName(string field)
	{
		UIDataSet.Report_ColRow report_ColRow = uIDataSet.Report_Col.FindByField(field);
		if (report_ColRow == null)
		{
			return string.Empty;
		}
		return report_ColRow.Display;
	}

	private void filterButton_Click(object sender, EventArgs e)
	{
		foreach (DataRowView item in exprBindingSource)
		{
			item.Row.Delete();
		}
		exprTableAdapter.Update(reportDataSet.Expr);
		if (timeCheckBox.Checked)
		{
			DateTime value = fromDatePicker.Value;
			DateTime value2 = fromTimePicker.Value;
			string text = new DateTime(value.Year, value.Month, value.Day, value2.Hour, value2.Minute, value2.Second).ToString("yyyy-MM-dd HH:mm:ss");
			DateTime value3 = toDatePicker.Value;
			DateTime value4 = toTimePicker.Value;
			string text2 = new DateTime(value3.Year, value3.Month, value3.Day, value4.Hour, value4.Minute, value4.Second).ToString("yyyy-MM-dd HH:mm:ss");
			reportDataSet.Expr.AddExprRow(Not: false, "AND", "[Log].[DateTime]", "BETWEEN", text, text2, string.Format("{0} : {1} ~ {2}", GetDisplayName("[Log].[DateTime]"), text, text2));
		}
		if (groupCheckBox.Checked && groupComboBox.SelectedIndex != -1)
		{
			reportDataSet.Expr.AddExprRow(Not: false, "AND", "[Device].[GID]", "=", groupComboBox.SelectedValue.ToString(), string.Empty, GetDisplayName("[Device].[GID]") + " = " + groupComboBox.Text);
		}
		if (tableCheckBox.Checked && deviceComboBox.SelectedIndex != -1)
		{
			reportDataSet.Expr.AddExprRow(Not: false, "AND", "[Device].[MAC]", "=", ((DataRowView)deviceComboBox.SelectedItem).Row.ItemArray[0].ToString(), string.Empty, GetDisplayName("[Device].[MAC]") + " = " + deviceComboBox.Text);
		}
		if (pluCheckBox.Checked && pluComboBox.SelectedIndex != -1)
		{
			reportDataSet.Expr.AddExprRow(Not: false, "AND", "[LogItem].[PLU]", "=", pluComboBox.SelectedValue.ToString(), "0", GetDisplayName("[LogItem].[PLU]") + " = " + pluComboBox.SelectedValue.ToString());
		}
		if (spf_CheckBox.Checked && fieldComboBox.SelectedIndex != -1)
		{
			string text3 = (string)fieldComboBox.SelectedValue;
			int num = 0;
			switch (text3)
			{
			case "[LogItem].[Count]":
				num = Settings.Default.Format_Weight;
				break;
			case "[LogItem].[Price]":
			case "[LogItem].[UnitPrice]":
			case "[LogItem].[Cost]":
			case "[LogItem].[Tax]":
				num = Settings.Default.Format_Price;
				break;
			default:
				num = 0;
				break;
			}
			string text4 = "F" + num;
			string text5 = op1_NumericUpDown.Value.ToString(text4);
			string text6 = op2_NumericUpDown.Value.ToString(text4);
			string text7 = opComboBox.Text;
			string displayName = GetDisplayName(text3);
			displayName = ((!(text7 == "BETWEEN")) ? $"{displayName} {text7} {text5}" : $"{displayName} : {text5} ~ {text6}");
			reportDataSet.Expr.AddExprRow(Not: false, "AND", text3, text7, text5, text6, displayName);
		}
		exprTableAdapter.Update(reportDataSet.Expr);
		FilterLog();
		filterButton.Enabled = false;
	}

	private void timeCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		DateTimePicker dateTimePicker = fromDatePicker;
		DateTimePicker dateTimePicker2 = fromTimePicker;
		DateTimePicker dateTimePicker3 = toDatePicker;
		bool flag = (toTimePicker.Enabled = timeCheckBox.Checked);
		bool flag3 = (dateTimePicker3.Enabled = flag);
		bool enabled = (dateTimePicker2.Enabled = flag3);
		dateTimePicker.Enabled = enabled;
		deviceComboBox.Enabled = tableCheckBox.Checked;
		groupComboBox.Enabled = groupCheckBox.Checked;
		pluComboBox.Enabled = pluCheckBox.Checked;
		filterButton.Enabled = true;
		ComboBox comboBox = fieldComboBox;
		ComboBox comboBox2 = opComboBox;
		NumericUpDown numericUpDown = op1_NumericUpDown;
		bool flag6 = (op2_NumericUpDown.Enabled = spf_CheckBox.Checked);
		bool flag8 = (numericUpDown.Enabled = flag6);
		bool enabled2 = (comboBox2.Enabled = flag8);
		comboBox.Enabled = enabled2;
	}

	private void filter_Changed(object sender, EventArgs e)
	{
		filterButton.Enabled = true;
	}

	private void pluComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["PLUID"], dataRowView["Name"]);
		}
	}

	private void GetInfo(string fileName, out string shopName, out string machineName, out string machineNumber, out string time, out string mac, out string mac_o, out string nVersion)
	{
		shopName = (machineName = (machineNumber = (time = (mac = (mac_o = (nVersion = string.Empty))))));
		if (string.IsNullOrEmpty(fileName) || !File.Exists(fileName))
		{
			return;
		}
		try
		{
			Cursor.Current = Cursors.WaitCursor;
			using StreamReader streamReader = new StreamReader(fileName, Program.GetEncoding());
			while (streamReader.Peek() >= 0)
			{
				string text = streamReader.ReadLine();
				string[] array = text.Split('\t');
				if (array.Length == 0)
				{
					continue;
				}
				switch (array[0])
				{
				case "TIM":
					try
					{
						time = new DateTime(Program.ParseInt(array[1]) + 2000, Program.ParseInt(array[2], 1), Program.ParseInt(array[3], 1), Program.ParseInt(array[4]), Program.ParseInt(array[5]), Program.ParseInt(array[6])).ToString("G");
					}
					catch (IndexOutOfRangeException)
					{
					}
					break;
				case "TMS":
					try
					{
						if (array[1] == "40" && machineNumber.Length == 0)
						{
							machineNumber = array[2];
						}
					}
					catch (IndexOutOfRangeException)
					{
					}
					break;
				case "TMT":
					try
					{
						if (array[1] == "0" && shopName.Length == 0)
						{
							shopName = array[2];
						}
						else if (array[1] == "1" && machineName.Length == 0)
						{
							machineName = array[2];
						}
					}
					catch (IndexOutOfRangeException)
					{
					}
					break;
				case "INF":
					try
					{
						shopName = array[1];
						machineName = array[2];
						machineNumber = array[3];
						string[] array2 = array[4].Split(' ');
						if (array2.Length <= 1)
						{
							nVersion = "";
						}
						else if (array2.Length == 2)
						{
							nVersion = array2[1];
						}
						else
						{
							nVersion = array2[array2.Length - 1];
						}
					}
					catch (IndexOutOfRangeException)
					{
					}
					break;
				case "INM":
					try
					{
						mac = array[1];
						if (array.Length >= 3)
						{
							mac_o = array[2];
						}
						else
						{
							mac_o = mac;
						}
					}
					catch (IndexOutOfRangeException)
					{
					}
					break;
				}
			}
		}
		catch (Exception ex6)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex6.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private string GetTableTypeText_Un()
	{
		return Program.GetLang("pw_Unattached");
	}

	private void UpdateTableTypeText(ListViewItem item, bool Add)
	{
		if (item.SubItems[1].Text.Length == 0)
		{
			item.SubItems[2].Text = Program.GetLang("pw_Unattached");
			return;
		}
		ReportDataSet.DeviceRow deviceRow = RDS.reportDataSet.Device.FindByMAC(item.SubItems[1].Text);
		if (deviceRow == null && Add && !Settings.Default.gen_MultiStock)
		{
			try
			{
				Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
			}
			catch (ApplicationException ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				item.SubItems[2].Text = Program.GetLang("pw_Unattached");
				return;
			}
			try
			{
				string deviceName = '★' + item.SubItems[3].Text + '★' + item.SubItems[4].Text + '★' + item.SubItems[5].Text;
				string mac = item.SubItems[1].Text;
				RDS.NL_DeviceAdd(deviceName, mac, 1, Program.GetLang("pw_Default"));
			}
			catch
			{
			}
			finally
			{
				Program.reportLock.ReleaseWriterLock();
			}
			deviceRow = RDS.reportDataSet.Device.FindByMAC(item.SubItems[1].Text);
		}
		if (deviceRow == null)
		{
			item.SubItems[2].Text = Program.GetLang("pw_Unattached");
			return;
		}
		ReportDataSet.SGroupRow sGroupRow = RDS.reportDataSet.SGroup.FindByGID(deviceRow.GID);
		if (sGroupRow == null)
		{
			item.SubItems[2].Text = Program.GetLang("pw_Unattached");
		}
		else
		{
			item.SubItems[2].Text = sGroupRow.GID + " - " + sGroupRow.Name;
		}
	}

	private void UpdateTableTypeText(ListViewItem item)
	{
		UpdateTableTypeText(item, Add: false);
	}

	private static string MakeTableName(string shopName, string machineName, string machineNumber)
	{
		return '★' + shopName + '★' + machineName + '★' + machineNumber;
	}

	private void importButton_Click(object sender, EventArgs e)
	{
		try
		{
			Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
		}
		catch (ApplicationException ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			return;
		}
		try
		{
			Cursor.Current = Cursors.WaitCursor;
			progressBar.Maximum = listView.CheckedItems.Count;
			progressBar.Value = 0;
			foreach (ListViewItem checkedItem in listView.CheckedItems)
			{
				OpenFromFile(checkedItem.SubItems[7].Text);
				progressBar.PerformStep();
			}
		}
		catch (Exception ex2)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
		finally
		{
			Cursor.Current = Cursors.Default;
			Program.reportLock.ReleaseWriterLock();
		}
	}

	private void listView_SelectedIndexChanged(object sender, EventArgs e)
	{
		UpdateFolderUI();
	}

	private ListViewItem GetCurrentItem()
	{
		if (listView.SelectedItems.Count < 1)
		{
			return null;
		}
		return listView.SelectedItems[0];
	}

	private void UpdateFolderUI()
	{
		ListViewItem currentItem = GetCurrentItem();
		if (currentItem == null)
		{
			specifyStock_Button.Enabled = false;
		}
		else if (currentItem.SubItems[2].Text != Program.GetLang("pw_Unattached") || currentItem.SubItems[1].Text.Length == 0)
		{
			specifyStock_Button.Enabled = false;
		}
		else
		{
			specifyStock_Button.Enabled = true;
		}
		allDefaultStock_Button.Enabled = false;
		foreach (ListViewItem item in listView.Items)
		{
			if (item.SubItems[2].Text == Program.GetLang("pw_Unattached") && item.SubItems[1].Text.Length != 0)
			{
				allDefaultStock_Button.Enabled = true;
			}
		}
		importButton.Enabled = listView.CheckedItems.Count > 0;
	}

	private static bool ItemAttached(ListViewItem item)
	{
		return item.SubItems[4].Text.Length != 0;
	}

	private void delButton_Click(object sender, EventArgs e)
	{
		ListViewItem currentItem = GetCurrentItem();
		if (currentItem != null)
		{
			currentItem.SubItems[4].Text = string.Empty;
			currentItem.Checked = false;
			UpdateFolderUI();
		}
	}

	private void listView_ItemCheck(object sender, ItemCheckEventArgs e)
	{
		if (e.NewValue == CheckState.Checked)
		{
			ListViewItem listViewItem = listView.Items[e.Index];
			if (listViewItem.SubItems[2].Text == Program.GetLang("pw_Unattached"))
			{
				e.NewValue = CheckState.Unchecked;
			}
		}
	}

	private void listView_ItemChecked(object sender, ItemCheckedEventArgs e)
	{
		importButton.Enabled = listView.CheckedItems.Count > 0;
	}

	private void allCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		foreach (ListViewItem item in listView.Items)
		{
			if (ItemAttached(item))
			{
				item.Checked = allCheckBox.Checked;
			}
		}
	}

	private void editTolStripButton_Click(object sender, EventArgs e)
	{
		ReportDataSet.DeviceRow currentDeviceRow = GetCurrentDeviceRow();
		if (currentDeviceRow == null || currentDeviceRow.MAC.Substring(0, 2) == "PC")
		{
			return;
		}
		using (DeviceSelForm deviceSelForm = new DeviceSelForm(currentDeviceRow.GID))
		{
			if (deviceSelForm.ShowDialog(this) == DialogResult.OK)
			{
				try
				{
					Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
				}
				catch (ApplicationException ex)
				{
					MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
					return;
				}
				try
				{
					if (!RDS.NL_DeviceAdd_FromDeviceSel(currentDeviceRow.Name, currentDeviceRow.MAC, deviceSelForm.SG_ID, deviceSelForm.SG_Name, deviceSelForm.SG_New))
					{
						MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
						return;
					}
				}
				catch
				{
				}
				finally
				{
					Program.reportLock.ReleaseWriterLock();
				}
			}
		}
		UpdateFolderUI();
	}

	private void tableDataGridView_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
	{
		if (e.RowIndex >= 0 && e.ColumnIndex >= 1)
		{
			editTolStripButton_Click(sender, e);
		}
	}

	private void Main_TabControl_SelectedIndexChanged(object sender, EventArgs e)
	{
		switch (Main_TabControl.SelectedIndex)
		{
		}
	}

	private void tableDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void reportDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void reportItemDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private ReportDataSet.DeviceRow GetCurrentDeviceRow()
	{
		if (!(deviceBindingSource.Current is DataRowView dataRowView))
		{
			return null;
		}
		return dataRowView.Row as ReportDataSet.DeviceRow;
	}

	private void deviceComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["MAC"], dataRowView["Name"]);
		}
	}

	private void allDefaultStock_Button_Click(object sender, EventArgs e)
	{
		bool flag = false;
		try
		{
			foreach (ListViewItem item in listView.Items)
			{
				if (!(item.SubItems[2].Text == Program.GetLang("pw_Unattached")) || item.SubItems[1].Text.Length == 0)
				{
					continue;
				}
				if (!flag)
				{
					try
					{
						Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
						flag = true;
					}
					catch (ApplicationException ex)
					{
						MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
						return;
					}
				}
				string deviceName = '★' + item.SubItems[3].Text + '★' + item.SubItems[4].Text + '★' + item.SubItems[5].Text;
				string mac = item.SubItems[1].Text;
				RDS.NL_DeviceAdd(deviceName, mac, 1, Program.GetLang("pw_Default"));
				UpdateTableTypeText(item);
				item.Checked = true;
			}
		}
		catch
		{
		}
		finally
		{
			if (flag)
			{
				Program.reportLock.ReleaseWriterLock();
			}
		}
		UpdateFolderUI();
	}

	private void existStock_Button_Click(object sender, EventArgs e)
	{
		ListViewItem currentItem = GetCurrentItem();
		if (currentItem == null || currentItem.SubItems[2].Text != Program.GetLang("pw_Unattached") || currentItem.SubItems[1].Text.Length == 0)
		{
			return;
		}
		using (DeviceSelForm deviceSelForm = new DeviceSelForm())
		{
			if (deviceSelForm.ShowDialog(this) == DialogResult.OK)
			{
				try
				{
					Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
				}
				catch (ApplicationException ex)
				{
					MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
					return;
				}
				try
				{
					if (!RDS.NL_DeviceAdd_FromDeviceSel('★' + currentItem.SubItems[3].Text + '★' + currentItem.SubItems[4].Text + '★' + currentItem.SubItems[5].Text, currentItem.SubItems[1].Text, deviceSelForm.SG_ID, deviceSelForm.SG_Name, deviceSelForm.SG_New))
					{
						MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
						return;
					}
					UpdateTableTypeText(currentItem);
					currentItem.Checked = true;
				}
				catch
				{
				}
				finally
				{
					Program.reportLock.ReleaseWriterLock();
				}
			}
		}
		UpdateFolderUI();
	}

	private void fileButton_Click(object sender, EventArgs e)
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.CheckFileExists = true;
		openFileDialog.Filter = Program.GetLang("pw_TMSFile___TMS____tms_AllFile_________");
		if (openFileDialog.ShowDialog(this) == DialogResult.OK)
		{
			Addfile(openFileDialog.FileName);
		}
		UpdateFolderUI();
	}

	private void Addfile(string fileName)
	{
		string machineName;
		string machineNumber;
		string time;
		string mac;
		string mac_o;
		string nVersion;
		string shopName = (machineName = (machineNumber = (time = (mac = (mac_o = (nVersion = ""))))));
		GetInfo(fileName, out shopName, out machineName, out machineNumber, out time, out mac, out mac_o, out nVersion);
		foreach (ListViewItem item in listView.Items)
		{
			if (item.SubItems[7].Text == fileName)
			{
				return;
			}
		}
		ListViewItem listViewItem2 = new ListViewItem(new string[8]
		{
			Path.GetFileName(fileName),
			mac,
			GetTableTypeText_Un(),
			shopName,
			machineName,
			machineNumber,
			time,
			fileName
		});
		UpdateTableTypeText(listViewItem2, Add: true);
		listViewItem2.Checked = listViewItem2.SubItems[2].Text != Program.GetLang("pw_Unattached");
		listView.Items.Add(listViewItem2);
	}

	private void folderButton_Click(object sender, EventArgs e)
	{
		try
		{
			Cursor.Current = Cursors.WaitCursor;
			using FolderBrowserDialog folderBrowserDialog = new FolderBrowserDialog();
			if (folderBrowserDialog.ShowDialog() == DialogResult.OK)
			{
				string[] files = Directory.GetFiles(folderBrowserDialog.SelectedPath, "*.tms", subdirCheckBox.Checked ? SearchOption.AllDirectories : SearchOption.TopDirectoryOnly);
				progressBar.Maximum = files.Length;
				progressBar.Value = 0;
				string[] array = files;
				foreach (string fileName in array)
				{
					Addfile(fileName);
					progressBar.PerformStep();
				}
				UpdateFolderUI();
			}
		}
		finally
		{
			Cursor.Current = Cursors.Default;
		}
	}

	private void clearButton_Click(object sender, EventArgs e)
	{
		listView.Items.Clear();
		importButton.Enabled = false;
	}

	private void openButton_Click(object sender, EventArgs e)
	{
		string text = "";
		try
		{
			Cursor.Current = Cursors.WaitCursor;
			if (int.TryParse(baudComboBox.Text, out var result))
			{
				Settings.Default.serailBaudRate = result;
				Settings.Default.Save();
				serialPort.BaudRate = result;
			}
			else
			{
				result = Settings.Default.serailBaudRate;
			}
			string strA = "";
			string text2;
			string deviceName = (text2 = "");
			string text3 = Settings.Default.configEncoding;
			serialPort.PortName = serialComboBox.Text;
			serialPort.NewLine = Environment.NewLine;
			string text4;
			do
			{
				serialPort.Close();
				serialPort.Encoding = Encoding.GetEncoding(text3);
				serialPort.Open();
				serialPort.ReadTimeout = 5000;
				text4 = text3;
				try
				{
					serialPort.WriteLine("UPL\tINF\t");
					while (true)
					{
						text = serialPort.ReadLine();
						string[] array = text.Split('\t');
						if (array[0] == "END")
						{
							break;
						}
						if (array[0] == "INA")
						{
							try
							{
								string text5 = array[1];
								string text6 = array[2];
								if (!(text6 == ""))
								{
									text3 = ((!(text5 == text6) && !(text5 == "")) ? text5 : text6);
								}
							}
							catch (IndexOutOfRangeException)
							{
							}
						}
						else
						{
							if (!(array[0] == "INF"))
							{
								continue;
							}
							try
							{
								deviceName = '★' + array[1] + '★' + array[2] + '★' + Program.ParseInt(array[3]);
								string[] array2 = array[4].Split(' ');
								if (array2.Length <= 1)
								{
									strA = "";
								}
								else if (array2.Length == 2)
								{
									strA = array2[1];
									_ = array2[0];
								}
								else
								{
									strA = array2[array2.Length - 1];
									_ = array2[array2.Length - 2];
									_ = array2[0];
								}
							}
							catch (IndexOutOfRangeException)
							{
							}
						}
					}
				}
				finally
				{
					serialPort.WriteLine("UPL\tEND\t");
				}
			}
			while (text4 != text3);
			try
			{
				serialPort.WriteLine("UPL\tMAC\t");
				while (true)
				{
					text = serialPort.ReadLine();
					if (text == null)
					{
						throw new IOException();
					}
					string[] array = text.Split('\t');
					if (array[0] == "END")
					{
						break;
					}
					if (array[0] == "MAC")
					{
						try
						{
							text2 = int.Parse(array[1]).ToString("X2") + int.Parse(array[2]).ToString("X2") + int.Parse(array[3]).ToString("X2") + int.Parse(array[4]).ToString("X2") + int.Parse(array[5]).ToString("X2") + int.Parse(array[6]).ToString("X2");
						}
						catch (IndexOutOfRangeException)
						{
						}
					}
				}
			}
			finally
			{
				serialPort.WriteLine("UPL\tEND\t");
			}
			if (text2.Length == 0)
			{
				throw new IOException();
			}
			ReportDataSet.DeviceRow deviceRow = RDS.reportDataSet.Device.FindByMAC(text2);
			if (deviceRow == null)
			{
				using DeviceSelForm deviceSelForm = new DeviceSelForm();
				if (deviceSelForm.ShowDialog(this) != DialogResult.OK)
				{
					throw new IOException();
				}
				try
				{
					Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
				}
				catch (ApplicationException ex4)
				{
					MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex4.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
					return;
				}
				try
				{
					if (!RDS.NL_DeviceAdd_FromDeviceSel(deviceName, text2, deviceSelForm.SG_ID, deviceSelForm.SG_Name, deviceSelForm.SG_New))
					{
						MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
						return;
					}
				}
				catch
				{
				}
				finally
				{
					Program.reportLock.ReleaseWriterLock();
				}
			}
			string text7 = "";
			try
			{
				string text8 = ((!reCheckBox.Checked && deviceRow.FIDed > 0) ? ("UPL\tREP\t" + deviceRow.FIDed + "\t") : "UPL\tREP\t-1\t");
				text7 = "";
				string text9;
				do
				{
					serialPort.WriteLine(text8);
					text9 = text7;
					text7 = "";
					int num = 0;
					while (true)
					{
						text = serialPort.ReadLine();
						if (text == null)
						{
							throw new IOException();
						}
						string[] array = text.Split('\t');
						if (array[0] == "END")
						{
							break;
						}
						if (array[0] == "RES")
						{
							num++;
						}
						text7 = text7 + text + "\n";
					}
					serialPort.WriteLine("UPL\tEND\t");
				}
				while (text7 != text9);
			}
			finally
			{
				serialPort.WriteLine("UPL\tEND\t");
			}
			try
			{
				Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
			}
			catch (ApplicationException ex5)
			{
				MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex5.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				return;
			}
			try
			{
				string[] lines = text7.Split(new string[1] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries);
				if (RDS.NL_Log_Get(text2, "", lines, out var error, out var success, string.Compare(strA, "V3.00A") < 0 || !Settings.Default.gen_CostFromDevice))
				{
					UploadReport_Log_Info(success);
				}
				else
				{
					UploadReport_Log_Error(error);
				}
			}
			catch (Exception ex6)
			{
				UploadReport_Log_Error(Program.GetLang("pw_ParseError") + ": " + ex6.Message + ',' + ex6.Source + ',' + string.Format(Program.GetLang("pw_cInfo_SingleDevice2"), text2));
			}
			finally
			{
				Program.reportLock.ReleaseWriterLock();
			}
			MessageBox.Show(this, Program.GetLang("pw_OperationSuccess"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
		}
		catch (Exception ex7)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex7.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
		finally
		{
			serialPort.Close();
			Cursor.Current = Cursors.Default;
		}
	}

	private void DataImport_TabPage_DragEnter(object sender, DragEventArgs e)
	{
		if (e.Data.GetDataPresent(DataFormats.FileDrop))
		{
			e.Effect = DragDropEffects.Link;
		}
		else
		{
			e.Effect = DragDropEffects.None;
		}
	}

	private void DataImport_TabPage_DragDrop(object sender, DragEventArgs e)
	{
		if (!e.Data.GetDataPresent(DataFormats.FileDrop))
		{
			return;
		}
		string text = ((Array)e.Data.GetData(DataFormats.FileDrop)).GetValue(0).ToString();
		if (File.Exists(text))
		{
			Addfile(text);
			UpdateFolderUI();
		}
		else if (Directory.Exists(text))
		{
			string[] files = Directory.GetFiles(text, "*.tms", subdirCheckBox.Checked ? SearchOption.AllDirectories : SearchOption.TopDirectoryOnly);
			progressBar.Maximum = files.Length;
			progressBar.Value = 0;
			string[] array = files;
			foreach (string fileName in array)
			{
				Addfile(fileName);
				progressBar.PerformStep();
			}
			UpdateFolderUI();
		}
	}

	private void listView_KeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode != Keys.Delete)
		{
			return;
		}
		e.Handled = true;
		foreach (ListViewItem selectedItem in listView.SelectedItems)
		{
			selectedItem.Remove();
		}
	}

	private ReportDataSet.SGroupRow GetCurrentSGroupRow()
	{
		if (!(sGroupBindingSource.Current is DataRowView dataRowView))
		{
			return null;
		}
		return dataRowView.Row as ReportDataSet.SGroupRow;
	}

	private void sGroupBindingSource_CurrentChanged()
	{
		bindingNavigatorDeleteItem5.Enabled = false;
	}

	private void bindingNavigatorDeleteItem5_Click(object sender, EventArgs e)
	{
		ReportDataSet.SGroupRow currentSGroupRow = GetCurrentSGroupRow();
		if (currentSGroupRow != null && currentSGroupRow.GID > 1)
		{
			string arg = currentSGroupRow.GID + " - " + currentSGroupRow.Name;
			if (MessageBox.Show(this, string.Format(Program.GetLang("pw_Delete_0__"), arg), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) == DialogResult.Yes)
			{
				RDS.SGroup_Remove(currentSGroupRow.GID);
			}
		}
	}

	private void stockItemDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void stockDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void sGroupDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void resultDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private ReportDataSet.StockItemRow GetCurrentStockItemRow()
	{
		if (!(stockItemBindingSource.Current is DataRowView dataRowView))
		{
			return null;
		}
		return dataRowView.Row as ReportDataSet.StockItemRow;
	}

	private ReportDataSet.StockRow GetCurrentStockRow()
	{
		if (!(stockBindingSource.Current is DataRowView dataRowView))
		{
			return null;
		}
		return dataRowView.Row as ReportDataSet.StockRow;
	}

	private void bindingNavigatorAddNewItem5_Click(object sender, EventArgs e)
	{
		using (DeviceSelForm deviceSelForm = new DeviceSelForm(-1))
		{
			if (deviceSelForm.ShowDialog(this) == DialogResult.OK)
			{
				try
				{
					Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
				}
				catch (ApplicationException ex)
				{
					MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
					return;
				}
				try
				{
					if (!RDS.NL_DeviceAdd_FromDeviceSel(null, null, deviceSelForm.SG_ID, deviceSelForm.SG_Name, deviceSelForm.SG_New))
					{
						MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
						return;
					}
				}
				catch
				{
				}
				finally
				{
					Program.reportLock.ReleaseWriterLock();
				}
			}
		}
		UpdateFolderUI();
	}

	private void sped_Check()
	{
		bool flag = false;
		ReportDataSet.SGroupRow currentSGroupRow = GetCurrentSGroupRow();
		if (currentSGroupRow != null)
		{
			ReportDataSet.StockRow[] stockRows = currentSGroupRow.GetStockRows();
			foreach (ReportDataSet.StockRow stockRow in stockRows)
			{
				if (stockRow.Sped)
				{
					flag = true;
					break;
				}
			}
		}
		DataGridViewTextBoxColumn dataGridViewTextBoxColumn = amountSPDataGridViewTextBoxColumn2;
		DataGridViewComboBoxColumn dataGridViewComboBoxColumn = unitSPDataGridViewComboBoxColumn2;
		DataGridViewTextBoxColumn dataGridViewTextBoxColumn2 = spoilageSPDataGridViewTextBoxColumn2;
		bool flag2 = (inAmountSPDataGridViewTextBoxColumn2.Visible = flag);
		bool flag4 = (dataGridViewTextBoxColumn2.Visible = flag2);
		bool visible = (dataGridViewComboBoxColumn.Visible = flag4);
		dataGridViewTextBoxColumn.Visible = visible;
		clearSP_ToolStripButton.Visible = flag;
		if (flag)
		{
			DataGridViewCellStyle dataGridViewCellStyle = new DataGridViewCellStyle();
			dataGridViewCellStyle.ForeColor = Color.Red;
			DataGridViewColumnHeaderCell headerCell = amountSPDataGridViewTextBoxColumn2.HeaderCell;
			DataGridViewColumnHeaderCell headerCell2 = unitSPDataGridViewComboBoxColumn2.HeaderCell;
			DataGridViewColumnHeaderCell headerCell3 = spoilageSPDataGridViewTextBoxColumn2.HeaderCell;
			DataGridViewCellStyle dataGridViewCellStyle2 = (inAmountSPDataGridViewTextBoxColumn2.HeaderCell.Style = dataGridViewCellStyle);
			DataGridViewCellStyle dataGridViewCellStyle4 = (headerCell3.Style = dataGridViewCellStyle2);
			DataGridViewCellStyle style = (headerCell2.Style = dataGridViewCellStyle4);
			headerCell.Style = style;
		}
	}

	private void sGroupBindingSource_CurrentChanged(object sender, EventArgs e)
	{
		sGroupBindingSource_CurrentChanged();
		sped_Check();
	}

	private void stockDataGridView_CellValueChanged(object sender, DataGridViewCellEventArgs e)
	{
		if (e.RowIndex != -1 && e.ColumnIndex != -1 && e.ColumnIndex == 14)
		{
			ReportDataSet.StockRow currentStockRow = GetCurrentStockRow();
			if (currentStockRow != null && RDS.FK_Stock_NewSafetyStock(currentStockRow.GID, currentStockRow.PLU, currentStockRow.SafetyStock))
			{
				currentStockRow.LowStock = currentStockRow.Amount < currentStockRow.SafetyStock;
			}
			else
			{
				currentStockRow.SafetyStock = RDS.reportDataSet.Stock.FindByGIDPLU(currentStockRow.GID, currentStockRow.PLU).SafetyStock;
			}
		}
	}

	private void clearSP_ToolStripButton_Click(object sender, EventArgs e)
	{
		ReportDataSet.SGroupRow currentSGroupRow = GetCurrentSGroupRow();
		if (currentSGroupRow != null && MessageBox.Show(this, string.Format(Program.GetLang("pw_Clear_0__"), "< S >"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) == DialogResult.Yes)
		{
			ApplicationException ex = RDS.FK_Stock_ClearSP(currentSGroupRow.GID);
			if (ex != null)
			{
				MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
			else
			{
				sped_Check();
			}
		}
	}

	private void clearIn_ToolStripButton_Click(object sender, EventArgs e)
	{
		ReportDataSet.SGroupRow currentSGroupRow = GetCurrentSGroupRow();
		if (currentSGroupRow != null && MessageBox.Show(this, string.Format(Program.GetLang("pw_Clear_0__"), "< + >"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) == DialogResult.Yes)
		{
			ApplicationException ex = RDS.FK_Stock_ClearIn(currentSGroupRow.GID);
			if (ex != null)
			{
				MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void stockSave(bool all)
	{
		if (!all && stockBindingSource.Count <= 0)
		{
			return;
		}
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.Title = Program.GetLang("pw_ExporttoExcelFile");
		saveFileDialog.OverwritePrompt = true;
		saveFileDialog.Filter = Program.GetLang("pw_ExcelFile___XLS____xls");
		if (saveFileDialog.ShowDialog(this) != DialogResult.OK)
		{
			return;
		}
		string fileName = saveFileDialog.FileName;
		try
		{
			if (File.Exists(fileName))
			{
				File.Delete(fileName);
			}
			Cursor.Current = Cursors.WaitCursor;
			using (OleDbConnection oleDbConnection = new OleDbConnection(Settings.Default.ReportConnectionString))
			{
				copyPUtable(oleDbConnection);
				oleDbConnection.Open();
				OleDbCommand oleDbCommand = new OleDbCommand();
				oleDbCommand.Connection = oleDbConnection;
				string text = string.Format("[Stock].[PLU] AS [{0}], [rPLU].[Name] AS [{1}], [Stock].[STakingTime] AS [{2}], CDbl([Stock].[Amount]) AS [{3}], [Stock].[Unit] AS [{4}], [rUnit].[Name] AS [{5}], CDbl([Stock].[Spoilage]) AS [{6}], CDbl([Stock].[In_Amount]) AS [{7}], ", pLUDataGridViewTextBoxColumn2_1.HeaderText.Replace(".", ""), pLUDataGridViewComboBoxColumn2_1.HeaderText.Replace(".", ""), sTakingTimeDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""), amountDataGridViewTextBoxColumn2_1.HeaderText.Replace(".", ""), unitDataGridViewTextBoxColumn2_1.HeaderText.Replace(".", ""), unitDataGridViewComboBoxColumn2_1.HeaderText.Replace(".", ""), spoilageDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""), inAmountDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""));
				if (clearSP_ToolStripButton.Visible)
				{
					text += string.Format("CDbl([Stock].[AmountSP]) AS [{0}], [Stock].[UnitSP] AS [{1}], [rUnitSP].[Name] AS [{2}], CDbl([Stock].[SpoilageSP]) AS [{3}], CDbl([Stock].[In_AmountSP]) AS [{4}], ", amountSPDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""), unitSPDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""), unitSPDataGridViewComboBoxColumn2.HeaderText.Replace(".", ""), spoilageSPDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""), inAmountSPDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""));
				}
				text += string.Format("CDbl([Stock].[In_Money]) AS [{0}], CDbl([Stock].[SafetyStock]) AS [{1}], IIF([Stock].[LowStock], 1, 0) AS [{2}], CDbl([Stock].[Order]) AS [{3}]", inMoneyDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""), safetyStockDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""), lowStockDataGridViewCheckBoxColumn2.HeaderText.Replace(".", ""), orderDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""));
				if (all)
				{
					foreach (ReportDataSet.SGroupRow item in reportDataSet.SGroup)
					{
						if (item.GID > 0)
						{
							string text2 = $"[Stock].[GID] = {item.GID}";
							oleDbCommand.CommandText = string.Format("SELECT {0} INTO [Excel 8.0;Database={1}].[{3}] FROM ((([Stock] LEFT JOIN [rPLU] ON [Stock].[PLU] = [rPLU].[PLUID])LEFT JOIN rUnit ON [Stock].[Unit] = [rUnit].[UnitID])LEFT JOIN rUnit AS rUnitSP ON [Stock].[UnitSP] = [rUnitSP].[UnitID])WHERE {2} ORDER BY [Stock].[PLU]", text, fileName, text2, item.GID + "." + item.Name);
							oleDbCommand.ExecuteNonQuery();
						}
					}
				}
				else
				{
					ReportDataSet.SGroupRow currentSGroupRow = GetCurrentSGroupRow();
					string text3 = $"[Stock].[GID] = {currentSGroupRow.GID}";
					oleDbCommand.CommandText = string.Format("SELECT {0} INTO [Excel 8.0;Database={1}].[{3}] FROM ((([Stock] LEFT JOIN [rPLU] ON [Stock].[PLU] = [rPLU].[PLUID])LEFT JOIN rUnit ON [Stock].[Unit] = [rUnit].[UnitID])LEFT JOIN rUnit AS rUnitSP ON [Stock].[UnitSP] = [rUnitSP].[UnitID])WHERE {2} ORDER BY [Stock].[PLU]", text, fileName, text3, currentSGroupRow.GID + "." + currentSGroupRow.Name);
					oleDbCommand.ExecuteNonQuery();
				}
				oleDbConnection.Close();
			}
			MessageBox.Show(this, Program.GetLang("pw_OperationSuccess"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
			base.DialogResult = DialogResult.OK;
			Process.Start(fileName);
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
		finally
		{
			Cursor.Current = Cursors.Default;
		}
	}

	private void stockSaveToolStripButton_Click(object sender, EventArgs e)
	{
		stockSave(all: false);
	}

	private void stockSaveAllToolStripButton_Click(object sender, EventArgs e)
	{
		stockSave(all: true);
	}

	private void stockItemSave(bool all)
	{
		if (!all && stockItemBindingSource.Count <= 0)
		{
			return;
		}
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.Title = Program.GetLang("pw_ExporttoExcelFile");
		saveFileDialog.OverwritePrompt = true;
		saveFileDialog.Filter = Program.GetLang("pw_ExcelFile___XLS____xls");
		if (saveFileDialog.ShowDialog(this) != DialogResult.OK)
		{
			return;
		}
		string fileName = saveFileDialog.FileName;
		try
		{
			if (File.Exists(fileName))
			{
				File.Delete(fileName);
			}
			string text = string.Format("[Device].[Name] AS [{11}], [StockItem].[MAC] AS [{0}], [StockItem].[FID] AS [{1}], [rStockType].[Name] AS [{2}], [StockItem].[DateTime] AS [{3}], [StockItem].[PLU] AS [{4}], [rPLU].[Name] AS [{5}], CDbl([StockItem].[UnitPrice]) AS [{6}], CDbl([StockItem].[Amount]) AS [{7}], [StockItem].[Unit] AS [{8}], [rUnit].[Name] AS [{9}], CDbl([StockItem].[Price]) AS [{10}]", mACDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""), fIDDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""), typeDataGridViewComboBoxColumn2.HeaderText.Replace(".", ""), dateTimeDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""), pLUDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""), pLUDataGridViewComboBoxColumn2.HeaderText.Replace(".", ""), unitPriceDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""), amountDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""), unitDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""), unitDataGridViewComboBoxColumn2.HeaderText.Replace(".", ""), priceDataGridViewTextBoxColumn2.HeaderText.Replace(".", ""), nameDataGridViewTextBoxColumn1.HeaderText.Replace(".", ""));
			Cursor.Current = Cursors.WaitCursor;
			using (OleDbConnection oleDbConnection = new OleDbConnection(Settings.Default.ReportConnectionString))
			{
				copyPUtable(oleDbConnection);
				oleDbConnection.Open();
				OleDbCommand oleDbCommand = new OleDbCommand();
				oleDbCommand.Connection = oleDbConnection;
				if (all)
				{
					foreach (ReportDataSet.SGroupRow item in reportDataSet.SGroup)
					{
						if (item.GID > 0)
						{
							string text2 = $"[StockItem].[GID] = {item.GID}";
							if (StockItemSave_Filter != "")
							{
								text2 = text2 + " AND [StockItem]." + StockItemSave_Filter;
							}
							oleDbCommand.CommandText = string.Format("SELECT {0} INTO [Excel 8.0;Database={1}].[{3}] FROM (((([StockItem] LEFT JOIN [rPLU] ON [StockItem].[PLU] = [rPLU].[PLUID])LEFT JOIN [rUnit] ON [StockItem].[Unit] = [rUnit].[UnitID])LEFT JOIN [rStockType] ON [StockItem].[Type] = [rStockType].[TypeID])LEFT JOIN [Device] ON [StockItem].[MAC] = [Device].[MAC])WHERE {2} ORDER BY [StockItem].[DateTime]", text, fileName, text2, item.GID + "." + item.Name);
							oleDbCommand.ExecuteNonQuery();
						}
					}
				}
				else
				{
					ReportDataSet.SGroupRow currentSGroupRow = GetCurrentSGroupRow();
					string text3 = $"[StockItem].[GID] = {currentSGroupRow.GID}";
					if (StockItemSave_Filter != "")
					{
						text3 = text3 + " AND [StockItem]." + StockItemSave_Filter;
					}
					oleDbCommand.CommandText = string.Format("SELECT {0} INTO [Excel 8.0;Database={1}].[{3}] FROM (((([StockItem] LEFT JOIN [rPLU] ON [StockItem].[PLU] = [rPLU].[PLUID])LEFT JOIN [rUnit] ON [StockItem].[Unit] = [rUnit].[UnitID])LEFT JOIN [rStockType] ON [StockItem].[Type] = [rStockType].[TypeID])LEFT JOIN [Device] ON [StockItem].[MAC] = [Device].[MAC])WHERE {2} ORDER BY [StockItem].[DateTime]", text, fileName, text3, currentSGroupRow.GID + "." + currentSGroupRow.Name);
					oleDbCommand.ExecuteNonQuery();
				}
				oleDbConnection.Close();
			}
			MessageBox.Show(this, Program.GetLang("pw_OperationSuccess"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
			base.DialogResult = DialogResult.OK;
			Process.Start(fileName);
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
		finally
		{
			Cursor.Current = Cursors.Default;
		}
	}

	private void stockItemSaveToolStripButton_Click(object sender, EventArgs e)
	{
		stockItemSave(all: false);
	}

	private void stockItemSaveAllToolStripButton_Click(object sender, EventArgs e)
	{
		stockItemSave(all: true);
	}

	private void clearOrder_ToolStripButton_Click(object sender, EventArgs e)
	{
		ReportDataSet.SGroupRow currentSGroupRow = GetCurrentSGroupRow();
		if (currentSGroupRow != null && MessageBox.Show(this, string.Format(Program.GetLang("pw_Clear_0__"), "< " + orderDataGridViewTextBoxColumn2.HeaderText + " >"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) == DialogResult.Yes)
		{
			ApplicationException ex = RDS.FK_Stock_ClearOrder(currentSGroupRow.GID);
			if (ex != null)
			{
				MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void clearSpoilage_ToolStripButton_Click(object sender, EventArgs e)
	{
		ReportDataSet.SGroupRow currentSGroupRow = GetCurrentSGroupRow();
		if (currentSGroupRow != null && MessageBox.Show(this, string.Format(Program.GetLang("pw_Clear_0__"), "< - >"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) == DialogResult.Yes)
		{
			ApplicationException ex = RDS.FK_Stock_ClearSpoilage(currentSGroupRow.GID);
			if (ex != null)
			{
				MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void filterDoButton_Click(object sender, EventArgs e)
	{
		FilterLog();
	}

	private void NeedFilter()
	{
		filterDoButton.Enabled = true;
		filterButton.Enabled = true;
	}

	private void NeedFilter(object sender, EventArgs e)
	{
		NeedFilter();
	}

	private void bindingNavigatorAddNewItem_Click(object sender, EventArgs e)
	{
		exprDataGridView.EndEdit();
		using ExprForm exprForm = new ExprForm();
		exprForm.ExprRow = reportDataSet.Expr.NewExprRow();
		if (exprForm.ShowDialog(this) == DialogResult.OK)
		{
			reportDataSet.Expr.AddExprRow(exprForm.ExprRow);
			NeedFilter();
		}
	}

	private void bindingNavigatorAddNewItem3_Click(object sender, EventArgs e)
	{
		ReportDataSet.SGroupRow currentSGroupRow = GetCurrentSGroupRow();
		if (currentSGroupRow == null)
		{
			return;
		}
		using StockItemForm stockItemForm = new StockItemForm(currentSGroupRow.GID);
		if (stockItemForm.ShowDialog(this) == DialogResult.OK)
		{
			int position = sGroupBindingSource.Position;
			Exception ex = RDS.FK_StockSingle(stockItemForm.SG_GID, stockItemForm.SG_Type, stockItemForm.SG_PLU, stockItemForm.SG_Unit, stockItemForm.SG_Amount, stockItemForm.SG_UnitPrice);
			if (ex != null)
			{
				MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
			else
			{
				sGroupBindingSource.Position = position;
			}
		}
	}

	public void mf_Dock_Start(Panel pl)
	{
		mf_Docking_Panel = pl;
		mf_Docking = true;
		mf_Dock_In();
	}

	public void mf_Dock_End()
	{
		mf_Docking = false;
		mf_Dock_Out();
		Close();
	}

	public void mf_Dock_In()
	{
		base.Parent = mf_Docking_Panel;
		base.FormBorderStyle = FormBorderStyle.None;
		Dock = DockStyle.Fill;
		MF_SplitContainer.Panel1Collapsed = true;
		shrink_ToolStrip.Visible = true;
		mf_Docked = true;
		DataSet_Refresh_DoAll(fucosed: true);
	}

	public void mf_Dock_Out()
	{
		base.MdiParent = Program.mf;
		Dock = DockStyle.None;
		base.FormBorderStyle = FormBorderStyle.Sizable;
		MF_SplitContainer.Panel2Collapsed = true;
		shrink_ToolStrip.Visible = false;
		base.Location = new Point(Program.mf.Size.Width / 8, Program.mf.Size.Height * 3 / 8);
		base.Size = new Size(Program.mf.Size.Width * 3 / 4, Program.mf.Size.Height / 2);
		mf_Docked = false;
		BringToFront();
		DataSet_Refresh_DoAll(fucosed: true);
	}

	public void mf_Expand()
	{
		MF_SplitContainer.Panel2Collapsed = true;
		DataSet_Refresh_DoAll(fucosed: true);
	}

	public void mf_Shrink()
	{
		MF_SplitContainer.Panel1Collapsed = true;
		DataSet_Refresh_DoAll(fucosed: true);
	}

	private void NetForm_Activated(object sender, EventArgs e)
	{
		if (base.FormBorderStyle != FormBorderStyle.None)
		{
			base.WindowState = FormWindowState.Normal;
		}
	}

	private void expand_L_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.m_guiderForm.expand_d();
		Main_TabControl.SelectedTab = Sale_TabPage;
	}

	private void expand_R_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.m_guiderForm.expand_d();
		Main_TabControl.SelectedTab = Stock_TabPage;
	}

	private void ReportForm_FormClosing(object sender, FormClosingEventArgs e)
	{
	}

	private void allLogItem_DataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void allStock_DataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void list_L_toolStripButton_Click(object sender, EventArgs e)
	{
		using CheckListForm checkListForm = new CheckListForm(3, new string[25]
		{
			mACDataGridViewTextBoxColumn3.HeaderText, nameDataGridViewTextBoxColumn3.HeaderText, fIDDataGridViewTextBoxColumn3.HeaderText, dateTimeDataGridViewTextBoxColumn3.HeaderText, sIDDataGridViewTextBoxColumn3.HeaderText, salesmanDataGridViewTextBoxColumn3.HeaderText, subIDDataGridViewTextBoxColumn3.HeaderText, typeDataGridViewTextBoxColumn3.HeaderText, typeDataGridViewComboBoxColumn3.HeaderText, pLUDataGridViewTextBoxColumn3.HeaderText,
			pLUDataGridViewComboBoxColumn3.HeaderText, unitDataGridViewTextBoxColumn3.HeaderText, unitDataGridViewComboBoxColumn3.HeaderText, amountDataGridViewTextBoxColumn3.HeaderText, unitPriceDataGridViewTextBoxColumn3.HeaderText, priceDataGridViewTextBoxColumn3.HeaderText, costDataGridViewTextBoxColumn3.HeaderText, taxDataGridViewTextBoxColumn3.HeaderText, classDataGridViewTextBoxColumn3.HeaderText, deptDataGridViewTextBoxColumn3.HeaderText,
			text1DataGridViewTextBoxColumn3.HeaderText, text2DataGridViewTextBoxColumn3.HeaderText, text3DataGridViewTextBoxColumn3.HeaderText, text4DataGridViewTextBoxColumn3.HeaderText, coFIDDataGridViewTextBoxColumn3.HeaderText
		}, new string[3]
		{
			list_L_toolStripButton.Text,
			Program.GetLang("pw_OK"),
			Program.GetLang("pw_Cancel")
		});
		checkListForm.DefaultChecked(new bool[25]
		{
			mACDataGridViewTextBoxColumn3.Visible, nameDataGridViewTextBoxColumn3.Visible, fIDDataGridViewTextBoxColumn3.Visible, dateTimeDataGridViewTextBoxColumn3.Visible, sIDDataGridViewTextBoxColumn3.Visible, salesmanDataGridViewTextBoxColumn3.Visible, subIDDataGridViewTextBoxColumn3.Visible, typeDataGridViewTextBoxColumn3.Visible, typeDataGridViewComboBoxColumn3.Visible, pLUDataGridViewTextBoxColumn3.Visible,
			pLUDataGridViewComboBoxColumn3.Visible, unitDataGridViewTextBoxColumn3.Visible, unitDataGridViewComboBoxColumn3.Visible, amountDataGridViewTextBoxColumn3.Visible, unitPriceDataGridViewTextBoxColumn3.Visible, priceDataGridViewTextBoxColumn3.Visible, costDataGridViewTextBoxColumn3.Visible, taxDataGridViewTextBoxColumn3.Visible, classDataGridViewTextBoxColumn3.Visible, deptDataGridViewTextBoxColumn3.Visible,
			text1DataGridViewTextBoxColumn3.Visible, text2DataGridViewTextBoxColumn3.Visible, text3DataGridViewTextBoxColumn3.Visible, text4DataGridViewTextBoxColumn3.Visible, coFIDDataGridViewTextBoxColumn3.Visible
		});
		checkListForm.DefaultEnabled(new bool[25]
		{
			true, true, true, true, true, true, true, true, true, true,
			true, true, true, true, true, true, true, true, true, true,
			true, true, true, true, true
		});
		if (checkListForm.ShowDialog(this) == DialogResult.OK)
		{
			mACDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(0);
			nameDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(1);
			fIDDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(2);
			dateTimeDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(3);
			sIDDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(4);
			salesmanDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(5);
			subIDDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(6);
			typeDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(7);
			typeDataGridViewComboBoxColumn3.Visible = checkListForm.Checked(8);
			pLUDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(9);
			pLUDataGridViewComboBoxColumn3.Visible = checkListForm.Checked(10);
			unitDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(11);
			unitDataGridViewComboBoxColumn3.Visible = checkListForm.Checked(12);
			amountDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(13);
			unitPriceDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(14);
			priceDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(15);
			costDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(16);
			taxDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(17);
			classDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(18);
			deptDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(19);
			text1DataGridViewTextBoxColumn3.Visible = checkListForm.Checked(20);
			text2DataGridViewTextBoxColumn3.Visible = checkListForm.Checked(21);
			text3DataGridViewTextBoxColumn3.Visible = checkListForm.Checked(22);
			text4DataGridViewTextBoxColumn3.Visible = checkListForm.Checked(23);
			coFIDDataGridViewTextBoxColumn3.Visible = checkListForm.Checked(24);
			Settings.Default.MFR_L_Amount = amountDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_AffiliatedClass = classDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_RelatedFID = coFIDDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_DateTime = dateTimeDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_AffiliatedDept = deptDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_FID = fIDDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_MAC = mACDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_DeviceName = nameDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_PLUName = pLUDataGridViewComboBoxColumn3.Visible;
			Settings.Default.MFR_L_PLUNo = pLUDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_Money = priceDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_Cost = costDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_SalesmanNo = salesmanDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_SID = sIDDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_SubID = subIDDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_Tax = taxDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_Text1 = text1DataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_Text2 = text2DataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_Text3 = text3DataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_Text4 = text4DataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_Type = typeDataGridViewComboBoxColumn3.Visible;
			Settings.Default.MFR_L_TypeNo = typeDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_UnitName = unitDataGridViewComboBoxColumn3.Visible;
			Settings.Default.MFR_L_UnitNo = unitDataGridViewTextBoxColumn3.Visible;
			Settings.Default.MFR_L_UnitPrice = unitPriceDataGridViewTextBoxColumn3.Visible;
			Settings.Default.Save();
		}
	}

	private void list_R_toolStripButton_Click(object sender, EventArgs e)
	{
		using CheckListForm checkListForm = new CheckListForm(3, new string[15]
		{
			kIDTimeDataGridViewTextBoxColumn4.HeaderText, gIDDataGridViewTextBoxColumn4.HeaderText, gIDDataGridViewComboBoxColumn4.HeaderText, pLUDataGridViewTextBoxColumn4.HeaderText, pLUDataGridViewComboBoxColumn4.HeaderText, unitDataGridViewTextBoxColumn4.HeaderText, unitDataGridViewComboBoxColumn4.HeaderText, amountDataGridViewTextBoxColumn4.HeaderText, sTakingTimeDataGridViewTextBoxColumn4.HeaderText, spoilageDataGridViewTextBoxColumn4.HeaderText,
			inAmountDataGridViewTextBoxColumn4.HeaderText, inMoneyDataGridViewTextBoxColumn4.HeaderText, safetyStockDataGridViewTextBoxColumn4.HeaderText, lowStockDataGridViewCheckBoxColumn4.HeaderText, orderDataGridViewTextBoxColumn4.HeaderText
		}, new string[3]
		{
			list_R_toolStripButton.Text,
			Program.GetLang("pw_OK"),
			Program.GetLang("pw_Cancel")
		});
		checkListForm.DefaultChecked(new bool[15]
		{
			kIDTimeDataGridViewTextBoxColumn4.Visible, gIDDataGridViewTextBoxColumn4.Visible, gIDDataGridViewComboBoxColumn4.Visible, pLUDataGridViewTextBoxColumn4.Visible, pLUDataGridViewComboBoxColumn4.Visible, unitDataGridViewTextBoxColumn4.Visible, unitDataGridViewComboBoxColumn4.Visible, amountDataGridViewTextBoxColumn4.Visible, sTakingTimeDataGridViewTextBoxColumn4.Visible, spoilageDataGridViewTextBoxColumn4.Visible,
			inAmountDataGridViewTextBoxColumn4.Visible, inMoneyDataGridViewTextBoxColumn4.Visible, safetyStockDataGridViewTextBoxColumn4.Visible, lowStockDataGridViewCheckBoxColumn4.Visible, orderDataGridViewTextBoxColumn4.Visible
		});
		checkListForm.DefaultEnabled(new bool[15]
		{
			false, true, true, true, false, true, true, false, true, true,
			true, true, true, true, true
		});
		if (checkListForm.ShowDialog(this) == DialogResult.OK)
		{
			kIDTimeDataGridViewTextBoxColumn4.Visible = checkListForm.Checked(0);
			gIDDataGridViewTextBoxColumn4.Visible = checkListForm.Checked(1);
			gIDDataGridViewComboBoxColumn4.Visible = checkListForm.Checked(2);
			pLUDataGridViewTextBoxColumn4.Visible = checkListForm.Checked(3);
			pLUDataGridViewComboBoxColumn4.Visible = checkListForm.Checked(4);
			unitDataGridViewTextBoxColumn4.Visible = checkListForm.Checked(5);
			unitDataGridViewComboBoxColumn4.Visible = checkListForm.Checked(6);
			amountDataGridViewTextBoxColumn4.Visible = checkListForm.Checked(7);
			sTakingTimeDataGridViewTextBoxColumn4.Visible = checkListForm.Checked(8);
			spoilageDataGridViewTextBoxColumn4.Visible = checkListForm.Checked(9);
			inAmountDataGridViewTextBoxColumn4.Visible = checkListForm.Checked(10);
			inMoneyDataGridViewTextBoxColumn4.Visible = checkListForm.Checked(11);
			safetyStockDataGridViewTextBoxColumn4.Visible = checkListForm.Checked(12);
			lowStockDataGridViewCheckBoxColumn4.Visible = checkListForm.Checked(13);
			orderDataGridViewTextBoxColumn4.Visible = checkListForm.Checked(14);
			Settings.Default.MFR_R_LastUpdate = kIDTimeDataGridViewTextBoxColumn4.Visible;
			Settings.Default.MFR_R_StockTableNumber = gIDDataGridViewTextBoxColumn4.Visible;
			Settings.Default.MFR_R_StockTable = gIDDataGridViewComboBoxColumn4.Visible;
			Settings.Default.MFR_R_PLUNo = pLUDataGridViewTextBoxColumn4.Visible;
			Settings.Default.MFR_R_PLUName = pLUDataGridViewComboBoxColumn4.Visible;
			Settings.Default.MFR_R_UnitNo = unitDataGridViewTextBoxColumn4.Visible;
			Settings.Default.MFR_R_UnitName = unitDataGridViewComboBoxColumn4.Visible;
			Settings.Default.MFR_R_Amount = amountDataGridViewTextBoxColumn4.Visible;
			Settings.Default.MFR_R_LastStocktaking = sTakingTimeDataGridViewTextBoxColumn4.Visible;
			Settings.Default.MFR_R_Spoilage = spoilageDataGridViewTextBoxColumn4.Visible;
			Settings.Default.MFR_R_SafetyStock = inAmountDataGridViewTextBoxColumn4.Visible;
			Settings.Default.MFR_R_LowStock = inMoneyDataGridViewTextBoxColumn4.Visible;
			Settings.Default.MFR_R_psAmount = safetyStockDataGridViewTextBoxColumn4.Visible;
			Settings.Default.MFR_R_psMoney = lowStockDataGridViewCheckBoxColumn4.Visible;
			Settings.Default.MFR_R_Order = orderDataGridViewTextBoxColumn4.Visible;
			Settings.Default.Save();
		}
	}

	private void shrink_Click(object sender, EventArgs e)
	{
		Program.mf.m_guiderForm.expand_normal();
	}

	private void splitContainer6_SizeChanged(object sender, EventArgs e)
	{
		if (splitContainer6.Size.Height > 210)
		{
			splitContainer6.SplitterDistance = splitContainer6.Size.Height - 200;
		}
	}

	private void sGroupBindingSource1_ListChanged(object sender, ListChangedEventArgs e)
	{
		groupComboBox.SelectedValue = 1;
	}

	private void pluComboBox_Format_1(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["PLUID"], dataRowView["Name"]);
		}
	}

	private void editStock_fuc(int ctGID)
	{
		using StockMultiItemForm stockMultiItemForm = new StockMultiItemForm(ctGID);
		int position = sGroupBindingSource.Position;
		if (stockMultiItemForm.ShowDialog(this) == DialogResult.OK)
		{
			DataSet_Refresh("Report");
			sGroupBindingSource.Position = position;
		}
	}

	private void editStock_ToolStripButton_Click(object sender, EventArgs e)
	{
		ReportDataSet.SGroupRow currentSGroupRow = GetCurrentSGroupRow();
		if (currentSGroupRow != null)
		{
			editStock_fuc(currentSGroupRow.GID);
		}
	}

	private void editStockSim_ToolStripButton_Click(object sender, EventArgs e)
	{
		ReportDataSet.SGroupRow sGroupRow = null;
		if (!Settings.Default.gen_MultiStock)
		{
			sGroupRow = RDS.reportDataSet.SGroup.FindByGID(1);
		}
		else
		{
			using DeviceSelForm deviceSelForm = new DeviceSelForm(an: false, 1);
			if (deviceSelForm.ShowDialog(this) == DialogResult.OK)
			{
				if (deviceSelForm.SG_ID < 0)
				{
					return;
				}
				sGroupRow = RDS.reportDataSet.SGroup.FindByGID(deviceSelForm.SG_ID);
			}
		}
		if (sGroupRow != null)
		{
			editStock_fuc(sGroupRow.GID);
		}
	}

	private void ExcelSCV_Click(int ctGID)
	{
		using StockExcelForm stockExcelForm = new StockExcelForm(ctGID);
		int position = sGroupBindingSource.Position;
		if (stockExcelForm.ShowDialog(this) == DialogResult.OK)
		{
			DataSet_Refresh("Report");
			sGroupBindingSource.Position = position;
		}
	}

	private void ExcelSCV_ToolStripButton_Click(object sender, EventArgs e)
	{
		ReportDataSet.SGroupRow currentSGroupRow = GetCurrentSGroupRow();
		if (currentSGroupRow != null)
		{
			ExcelSCV_Click(currentSGroupRow.GID);
		}
	}

	private void ExcelSCV2_ToolStripButton_Click(object sender, EventArgs e)
	{
		ReportDataSet.SGroupRow sGroupRow = null;
		if (!Settings.Default.gen_MultiStock)
		{
			sGroupRow = RDS.reportDataSet.SGroup.FindByGID(1);
		}
		else
		{
			using DeviceSelForm deviceSelForm = new DeviceSelForm(an: false, 1);
			if (deviceSelForm.ShowDialog(this) == DialogResult.OK)
			{
				if (deviceSelForm.SG_ID < 0)
				{
					return;
				}
				sGroupRow = RDS.reportDataSet.SGroup.FindByGID(deviceSelForm.SG_ID);
			}
		}
		if (sGroupRow != null)
		{
			ExcelSCV_Click(sGroupRow.GID);
		}
	}

	private void bindingNavigatorFilter_CheckedChanged(object sender, EventArgs e)
	{
		if (bindingNavigatorFilter.Checked)
		{
			using (FilterForm filterForm = new FilterForm(stockItemDataGridView))
			{
				if (filterForm.ShowDialog(this) == DialogResult.OK)
				{
					stockItemBindingSource.Filter = filterForm.FilterString;
					StockItemSave_Filter = filterForm.FilterString_DT;
					FilterAdd_ToolStripButton.Visible = true;
				}
				else
				{
					bindingNavigatorFilter.Checked = false;
					FilterAdd_ToolStripButton.Visible = false;
				}
				return;
			}
		}
		FilterAdd_ToolStripButton.Visible = false;
		stockItemBindingSource.RemoveFilter();
		StockItemSave_Filter = "";
	}

	private void FilterAdd_ToolStripButton_Click(object sender, EventArgs e)
	{
		using FilterForm filterForm = new FilterForm(stockItemDataGridView);
		if (filterForm.ShowDialog(this) == DialogResult.OK)
		{
			BindingSource bindingSource = stockItemBindingSource;
			bindingSource.Filter = bindingSource.Filter + " AND " + filterForm.FilterString;
			StockItemSave_Filter = StockItemSave_Filter + " AND " + filterForm.FilterString_DT;
		}
	}

	private void deviceBindingSource_CurrentChanged(object sender, EventArgs e)
	{
		ReportDataSet.DeviceRow currentDeviceRow = GetCurrentDeviceRow();
		if (currentDeviceRow != null && currentDeviceRow.MAC != null)
		{
			logTableAdapter.FillPartByMAC(reportDataSet.Log, currentDeviceRow.MAC);
			logItemTableAdapter.FillPartByMAC(reportDataSet.LogItem, currentDeviceRow.MAC);
		}
	}

	private void opComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		op2_NumericUpDown.Visible = opComboBox.Text == "BETWEEN";
		filter_Changed(null, null);
	}

	private void fieldComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		string text = fieldComboBox.SelectedValue as string;
		if (!string.IsNullOrEmpty(text))
		{
			switch (text)
			{
			case "[LogItem].[Count]":
			{
				NumericUpDown numericUpDown3 = op1_NumericUpDown;
				int decimalPlaces3 = (op2_NumericUpDown.DecimalPlaces = Settings.Default.Format_Weight);
				numericUpDown3.DecimalPlaces = decimalPlaces3;
				break;
			}
			case "[LogItem].[Price]":
			case "[LogItem].[UnitPrice]":
			case "[LogItem].[Cost]":
			case "[LogItem].[Tax]":
			{
				NumericUpDown numericUpDown2 = op1_NumericUpDown;
				int decimalPlaces2 = (op2_NumericUpDown.DecimalPlaces = Settings.Default.Format_Price);
				numericUpDown2.DecimalPlaces = decimalPlaces2;
				break;
			}
			default:
			{
				NumericUpDown numericUpDown = op1_NumericUpDown;
				int decimalPlaces = (op2_NumericUpDown.DecimalPlaces = 0);
				numericUpDown.DecimalPlaces = decimalPlaces;
				break;
			}
			}
			filter_Changed(null, null);
		}
	}

	private void excelDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}
}
