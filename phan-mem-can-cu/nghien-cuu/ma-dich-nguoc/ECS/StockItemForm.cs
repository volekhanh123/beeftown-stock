using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;
using ECS.ReportDataSetTableAdapters;

namespace ECS;

public class StockItemForm : Form
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

	private int ctGID;

	private int ctPLU;

	private int ctUnit;

	private int ctType;

	private decimal ctAmount;

	private decimal ctUnitPrice;

	private decimal ctTotal;

	private int ctc_DotAmount;

	private decimal ctplu_priceout;

	private decimal ctplu_pricein;

	private int saletype = 1;

	private bool pLUBindingSource2_CurrentChanging;

	private IContainer components;

	private PLUTableAdapter pluTableAdapter;

	private SGroupTableAdapter sGroupTableAdapter;

	private Button okButton;

	private Button cancelButton;

	private ComboBox SGroup_ComboBox;

	private Label sGroup_Label;

	private Label PLU_Label;

	private ComboBox PLU_ComboBox;

	private ComboBox Type_ComboBox;

	private Label Type_Label;

	private Label Amount_Label;

	private ComboBox Unit_ComboBox;

	private Label Unit_Label;

	private Label Total_Label;

	private Label ES_Label;

	private ECSDataSet ecsDataSet;

	private ReportDataSet reportDataSet;

	private UIDataSet uiDataSet;

	private BindingSource unitBindingSource;

	private BindingSource sGourpBindingSource;

	private BindingSource pLUBindingSource;

	private Label UnitPrice_Label;

	private StockTableAdapter stockTableAdapter;

	private TextBox Amount_TextBox;

	private TextBox UnitPrice_TextBox;

	private TextBox Total_TextBox;

	private TextBox ES_TextBox;

	private SplitContainer splitContainer1;

	private DataGridView pLUDataGridView;

	private BindingNavigator pLUBindingNavigator;

	private ToolStripLabel bindingNavigatorCountItem;

	private ToolStripButton bindingNavigatorMoveFirstItem;

	private ToolStripButton bindingNavigatorMovePreviousItem;

	private ToolStripSeparator bindingNavigatorSeparator;

	private ToolStripTextBox bindingNavigatorPositionItem;

	private ToolStripSeparator bindingNavigatorSeparator1;

	private ToolStripButton bindingNavigatorMoveNextItem;

	private ToolStripButton bindingNavigatorMoveLastItem;

	private ToolStripSeparator bindingNavigatorSeparator2;

	private ToolStripTextBox bindingNavigatorID;

	private ToolStripDropDownButton gotoType_ToolStripDropDownButton;

	private ToolStripMenuItem numberToolStripMenuItem;

	private ToolStripMenuItem itemCodeToolStripMenuItem;

	private ToolStripMenuItem indexToolStripMenuItem;

	private ToolStripButton bindingNavigatorGoto;

	private ToolStripButton bindingNavigatorFilter;

	private ToolStripButton FilterAdd_ToolStripButton;

	private BindingSource unitBindingSource2;

	private BindingSource pLUBindingSource2;

	private DataGridViewTextBoxColumn pluidTextBoxColumn;

	private DataGridViewTextBoxColumn itemcodeTextBoxColumn;

	private DataGridViewTextBoxColumn indexTextBoxColumn;

	private DataGridViewTextBoxColumn nameTextBoxColumn;

	private DataGridViewComboBoxColumn unitComboBoxColumn;

	private DataGridViewTextBoxColumn priceTextBoxColumn;

	private DataGridViewTextBoxColumn costTextBoxColumn;

	private ToolStripMenuItem nameToolStripMenuItem;

	public int SG_GID => ctGID;

	public int SG_Type => (int)Type_ComboBox.SelectedValue;

	public int SG_PLU => ctPLU;

	public int SG_Unit => ctUnit;

	public decimal SG_Amount => ctAmount;

	public decimal SG_UnitPrice => ctUnitPrice;

	public decimal SG_Total => ctTotal;

	public StockItemForm(int inGID)
	{
		ctGID = inGID;
		InitializeComponent();
	}

	private void StockItemForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_NewStockItem");
		Amount_Label.Text = Program.GetLang("pw_Amount");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		ES_Label.Text = Program.GetLang("pw_Spoilage");
		okButton.Text = Program.GetLang("pw_OK");
		PLU_Label.Text = Program.GetLang("pw_PLU");
		sGroup_Label.Text = Program.GetLang("pw_StockTable");
		Total_Label.Text = Program.GetLang("pw_TotalPrice");
		Type_Label.Text = Program.GetLang("pw_Type");
		Unit_Label.Text = Program.GetLang("pw_Unit");
		UnitPrice_Label.Text = Program.GetLang("pw_UnitPrice");
		numberToolStripMenuItem.Text = Program.GetLang("pw_Number");
		itemCodeToolStripMenuItem.Text = Program.GetLang("pw_ItemCode");
		indexToolStripMenuItem.Text = Program.GetLang("pw_IndexBarcode");
		nameToolStripMenuItem.Text = Program.GetLang("pw_Name");
		gotoType_ToolStripDropDownButton.Text = Program.GetLang("pw_Switchto");
		bindingNavigatorFilter.Text = Program.GetLang("pw_Filter");
		FilterAdd_ToolStripButton.Text = Program.GetLang("pw_Filter") + "+";
		bindingNavigatorGoto.Text = Program.GetLang("pw_Switchto");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		costTextBoxColumn.HeaderText = Program.GetLang("pw_Cost");
		pluidTextBoxColumn.HeaderText = Program.GetLang("pw_Number");
		nameTextBoxColumn.HeaderText = Program.GetLang("pw_Name");
		unitComboBoxColumn.HeaderText = Program.GetLang("pw_Unit");
		indexTextBoxColumn.HeaderText = Program.GetLang("pw_IndexBarcode");
		priceTextBoxColumn.HeaderText = Program.GetLang("pw_UPrice");
		itemcodeTextBoxColumn.HeaderText = Program.GetLang("pw_ItemCode");
		Font = Settings.Default.CustomFont;
		string fileName = Application.StartupPath + "\\Combo.xml";
		uiDataSet.SimCombo.ReadXml(fileName);
		RDS.DataSet_Init_Unit(ref ecsDataSet);
		sGroupTableAdapter.Fill(reportDataSet.SGroup);
		stockTableAdapter.Fill(reportDataSet.Stock);
		pluTableAdapter.Fill(ecsDataSet.PLU);
		string[] array = uiDataSet.SimCombo.FindByName("Stock Type Full").ValueDisplay.Split('|');
		int num = 0;
		for (int i = 0; i < array.Length / 2; i++)
		{
			new SimComboVD_No();
			if (int.Parse(array[i * 2]) >= 0 && int.Parse(array[i * 2]) < 100)
			{
				num++;
			}
		}
		SimComboVD_No[] array2 = new SimComboVD_No[num];
		num = 0;
		for (int j = 0; j < array.Length / 2; j++)
		{
			int num2 = int.Parse(array[j * 2]);
			if (num2 >= 0 && num2 < 100)
			{
				SimComboVD_No simComboVD_No = new SimComboVD_No();
				simComboVD_No.Value = num2;
				simComboVD_No.Display = array[j * 2 + 1];
				array2[num] = simComboVD_No;
				num++;
			}
		}
		Type_ComboBox.ValueMember = "Value";
		Type_ComboBox.DisplayMember = "Display";
		Type_ComboBox.DataSource = array2;
		SGroup_ComboBox.SelectedValue = ctGID;
		PLU_ComboBox.SelectedIndex = -1;
		Unit_ComboBox.SelectedIndex = -1;
		ctc_DotAmount = Settings.Default.Format_Weight;
		Unit_ComboBox.Enabled = Program.right != Program.Right.User;
		UnitPrice_TextBox_TextChanged();
		UnitPrice_TextBox_Validating();
		Amount_TextBox_TextChanged();
		Amount_TextBox_Validating();
		FilterAdd_ToolStripButton.Visible = false;
		pLUBindingSource2_CurrentChanged(null, null);
	}

	private void okbuttoncheck()
	{
		try
		{
			if ((int)Type_ComboBox.SelectedValue >= 0 && Unit_ComboBox.SelectedIndex >= 0 && saletype < 2 && ctAmount != 0m)
			{
				if ((int)Type_ComboBox.SelectedValue <= 1)
				{
					okButton.Enabled = true;
					return;
				}
				DataRow[] array = RDS.eCSDataSet.CoPLU_ProMat.Select($"[PLUID_Product] = '{ctPLU}'");
				okButton.Enabled = array.Length == 0;
			}
			else
			{
				okButton.Enabled = false;
			}
		}
		catch (Exception)
		{
			okButton.Enabled = false;
		}
	}

	private void Unit_ComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		try
		{
			ctUnit = (int)Unit_ComboBox.SelectedValue;
			ECSDataSet.UnitRow unitRow = ecsDataSet.Unit.FindByUnitID(ctUnit);
			if (unitRow.Punit == 1)
			{
				ctc_DotAmount = Settings.Default.Format_Weight;
			}
			else
			{
				ctc_DotAmount = 0;
			}
		}
		catch (Exception)
		{
			ctc_DotAmount = Settings.Default.Format_Weight;
			return;
		}
		Amount_TextBox_TextChanged();
		Amount_TextBox_Validating();
		escal();
		okbuttoncheck();
	}

	private void SGroup_ComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["GID"], dataRowView["Name"]);
		}
	}

	private void PLU_ComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["PLUID"], dataRowView["Name"]);
		}
	}

	private void totalcal()
	{
		ctTotal = RDS.Calculate_TotalPrice(ctUnitPrice, ctAmount);
		Total_TextBox.Text = ctTotal.ToString();
	}

	private void escal()
	{
		ReportDataSet.StockRow stockRow = reportDataSet.Stock.FindByGIDPLU(ctGID, ctPLU);
		decimal num;
		if (stockRow == null)
		{
			num = 0m;
		}
		else if (stockRow.Unit == ctUnit)
		{
			num = stockRow.Amount;
		}
		else if (stockRow.UnitSP == ctUnit)
		{
			num = stockRow.AmountSP;
		}
		else
		{
			ECSDataSet.UnitRow unitRow = ecsDataSet.Unit.FindByUnitID(ctUnit);
			ECSDataSet.UnitRow unitRow2 = ecsDataSet.Unit.FindByUnitID(stockRow.Unit);
			ECSDataSet.UnitRow unitRow3 = ecsDataSet.Unit.FindByUnitID(stockRow.UnitSP);
			num = ((unitRow2.Punit == unitRow.Punit) ? Math.Round(stockRow.Amount * unitRow2.Pack / unitRow.Pack, ctc_DotAmount) : ((unitRow3.Punit != unitRow.Punit) ? 0m : Math.Round(stockRow.AmountSP * unitRow3.Pack / unitRow.Pack, ctc_DotAmount)));
		}
		ES_TextBox.Text = (num - ctAmount).ToString();
	}

	private void UnitPrice_Update()
	{
		try
		{
			ctType = (int)Type_ComboBox.SelectedValue;
			if (ctType == 0 || ctType == 1)
			{
				UnitPrice_TextBox.Text = ctplu_priceout.ToString();
			}
			else if (ctType == 10 || ctType == 11)
			{
				UnitPrice_TextBox.Text = ctplu_pricein.ToString();
			}
			else
			{
				UnitPrice_TextBox.Text = "0";
			}
			UnitPrice_TextBox_TextChanged();
			UnitPrice_TextBox_Validating();
		}
		catch
		{
		}
	}

	private void Type_ComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		try
		{
			UnitPrice_Update();
			ctType = (int)Type_ComboBox.SelectedValue;
			if (ctType == 12)
			{
				saletype = 0;
				escal();
				Label unitPrice_Label = UnitPrice_Label;
				TextBox unitPrice_TextBox = UnitPrice_TextBox;
				Label total_Label = Total_Label;
				bool flag = (Total_TextBox.Visible = false);
				bool flag3 = (total_Label.Visible = flag);
				bool visible = (unitPrice_TextBox.Visible = flag3);
				unitPrice_Label.Visible = visible;
				Label eS_Label = ES_Label;
				bool visible2 = (ES_TextBox.Visible = true);
				eS_Label.Visible = visible2;
			}
			else if (ctType == 0 || ctType == 11)
			{
				saletype = 1;
				totalcal();
				Label unitPrice_Label2 = UnitPrice_Label;
				TextBox unitPrice_TextBox2 = UnitPrice_TextBox;
				Label total_Label2 = Total_Label;
				bool flag7 = (Total_TextBox.Visible = true);
				bool flag9 = (total_Label2.Visible = flag7);
				bool visible3 = (unitPrice_TextBox2.Visible = flag9);
				unitPrice_Label2.Visible = visible3;
				Label eS_Label2 = ES_Label;
				bool visible4 = (ES_TextBox.Visible = false);
				eS_Label2.Visible = visible4;
			}
			else if (ctType == 1 || ctType == 10)
			{
				saletype = -1;
				totalcal();
				Label unitPrice_Label3 = UnitPrice_Label;
				TextBox unitPrice_TextBox3 = UnitPrice_TextBox;
				Label total_Label3 = Total_Label;
				bool flag13 = (Total_TextBox.Visible = true);
				bool flag15 = (total_Label3.Visible = flag13);
				bool visible5 = (unitPrice_TextBox3.Visible = flag15);
				unitPrice_Label3.Visible = visible5;
				Label eS_Label3 = ES_Label;
				bool visible6 = (ES_TextBox.Visible = false);
				eS_Label3.Visible = visible6;
			}
			else if (ctType == 13)
			{
				saletype = 0;
				Label unitPrice_Label4 = UnitPrice_Label;
				TextBox unitPrice_TextBox4 = UnitPrice_TextBox;
				Label total_Label4 = Total_Label;
				bool flag19 = (Total_TextBox.Visible = false);
				bool flag21 = (total_Label4.Visible = flag19);
				bool visible7 = (unitPrice_TextBox4.Visible = flag21);
				unitPrice_Label4.Visible = visible7;
				Label eS_Label4 = ES_Label;
				bool visible8 = (ES_TextBox.Visible = false);
				eS_Label4.Visible = visible8;
			}
			else if (ctType == 14)
			{
				saletype = 0;
				ES_TextBox.Text = ctAmount.ToString();
				Label unitPrice_Label5 = UnitPrice_Label;
				TextBox unitPrice_TextBox5 = UnitPrice_TextBox;
				Label total_Label5 = Total_Label;
				bool flag25 = (Total_TextBox.Visible = false);
				bool flag27 = (total_Label5.Visible = flag25);
				bool visible9 = (unitPrice_TextBox5.Visible = flag27);
				unitPrice_Label5.Visible = visible9;
				Label eS_Label5 = ES_Label;
				bool visible10 = (ES_TextBox.Visible = false);
				eS_Label5.Visible = visible10;
			}
			else
			{
				saletype = 2;
				Label unitPrice_Label6 = UnitPrice_Label;
				TextBox unitPrice_TextBox6 = UnitPrice_TextBox;
				Label total_Label6 = Total_Label;
				bool flag31 = (Total_TextBox.Visible = false);
				bool flag33 = (total_Label6.Visible = flag31);
				bool visible11 = (unitPrice_TextBox6.Visible = flag33);
				unitPrice_Label6.Visible = visible11;
				Label eS_Label6 = ES_Label;
				bool visible12 = (ES_TextBox.Visible = false);
				eS_Label6.Visible = visible12;
			}
			Amount_TextBox_TextChanged();
			Amount_TextBox_Validating();
			okbuttoncheck();
		}
		catch (Exception)
		{
		}
	}

	private void Amount_TextBox_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == '.')
		{
			if (Amount_TextBox.Text.IndexOf(".") >= 0 || ctc_DotAmount == 0)
			{
				e.Handled = true;
			}
		}
		else if (e.KeyChar != '\b')
		{
			if (e.KeyChar == '\r')
			{
				Amount_TextBox_Validating();
			}
			else if (e.KeyChar < '0' || e.KeyChar > '9')
			{
				e.Handled = true;
			}
		}
	}

	private void Amount_TextBox_TextChanged()
	{
		string text = Amount_TextBox.Text;
		if (text.IndexOf(".") == 0)
		{
			text = "0" + text;
		}
		if (!decimal.TryParse(text, out var result))
		{
			result = 0m;
		}
		result = Math.Round(Math.Abs(result), ctc_DotAmount);
		ctAmount = result;
		totalcal();
		escal();
		okbuttoncheck();
	}

	private void Amount_TextBox_TextChanged(object sender, EventArgs e)
	{
		Amount_TextBox_TextChanged();
	}

	private void Amount_TextBox_Validating()
	{
		Amount_TextBox.Text = ctAmount.ToString("F" + ctc_DotAmount);
	}

	private void Amount_TextBox_Validating(object sender, CancelEventArgs e)
	{
		Amount_TextBox_Validating();
	}

	private void UnitPrice_TextBox_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == '.')
		{
			if (UnitPrice_TextBox.Text.IndexOf(".") >= 0 || Settings.Default.Format_Price == 0)
			{
				e.Handled = true;
			}
		}
		else if (e.KeyChar != '\b')
		{
			if (e.KeyChar == '\r')
			{
				UnitPrice_TextBox_Validating();
			}
			else if (e.KeyChar < '0' || e.KeyChar > '9')
			{
				e.Handled = true;
			}
		}
	}

	private void UnitPrice_TextBox_TextChanged()
	{
		string text = UnitPrice_TextBox.Text;
		if (text.IndexOf(".") == 0)
		{
			text = "0" + text;
		}
		if (!decimal.TryParse(text, out var result))
		{
			result = 0m;
		}
		ctUnitPrice = Math.Round(Math.Abs(result), Settings.Default.Format_Price);
		totalcal();
	}

	private void UnitPrice_TextBox_TextChanged(object sender, EventArgs e)
	{
		UnitPrice_TextBox_TextChanged();
	}

	private void UnitPrice_TextBox_Validating()
	{
		UnitPrice_TextBox.Text = ctUnitPrice.ToString("F" + Settings.Default.Format_Price);
	}

	private void UnitPrice_TextBox_Validating(object sender, CancelEventArgs e)
	{
		UnitPrice_TextBox_Validating();
	}

	private void Unit_ComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["UnitID"], dataRowView["Name"]);
		}
	}

	private void bindingNavigatorGoto_Click(object sender, EventArgs e)
	{
		if (bindingNavigatorID.Text.Length == 0)
		{
			return;
		}
		if (numberToolStripMenuItem.Checked)
		{
			int num;
			try
			{
				num = pLUBindingSource2.Find("PLUID", bindingNavigatorID.Text);
			}
			catch (Exception)
			{
				num = -1;
			}
			if (num != -1)
			{
				pLUBindingSource2.Position = num;
			}
		}
		else if (itemCodeToolStripMenuItem.Checked)
		{
			int num;
			try
			{
				num = pLUBindingSource2.Find("Remark", bindingNavigatorID.Text);
			}
			catch (Exception)
			{
				num = -1;
			}
			if (num != -1)
			{
				pLUBindingSource2.Position = num;
			}
		}
		else if (indexToolStripMenuItem.Checked)
		{
			int num;
			try
			{
				num = pLUBindingSource2.Find("Index", bindingNavigatorID.Text);
			}
			catch (Exception)
			{
				num = -1;
			}
			if (num != -1)
			{
				pLUBindingSource2.Position = num;
			}
		}
		else if (nameToolStripMenuItem.Checked)
		{
			int num;
			try
			{
				num = pLUBindingSource.Find("Name", bindingNavigatorID.Text);
			}
			catch (Exception)
			{
				num = -1;
			}
			if (num != -1)
			{
				pLUBindingSource.Position = num;
			}
		}
	}

	private void bindingNavigatorFilter_CheckedChanged(object sender, EventArgs e)
	{
		if (bindingNavigatorFilter.Checked)
		{
			using (FilterForm filterForm = new FilterForm(pLUDataGridView))
			{
				if (filterForm.ShowDialog(this) == DialogResult.OK)
				{
					pLUBindingSource2.Filter = filterForm.FilterString;
					if (Program.right == Program.Right.User)
					{
						BindingSource bindingSource = pLUBindingSource2;
						bindingSource.Filter = bindingSource.Filter + " AND PLUID >= " + Settings.Default.minUserPLUID;
					}
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
		if (Program.right == Program.Right.User)
		{
			pLUBindingSource2.Filter = "PLUID >= " + Settings.Default.minUserPLUID;
		}
		else
		{
			pLUBindingSource2.RemoveFilter();
		}
	}

	private void FilterAdd_ToolStripButton_Click(object sender, EventArgs e)
	{
		using FilterForm filterForm = new FilterForm(pLUDataGridView);
		if (filterForm.ShowDialog(this) == DialogResult.OK)
		{
			BindingSource bindingSource = pLUBindingSource2;
			bindingSource.Filter = bindingSource.Filter + " AND " + filterForm.FilterString;
		}
	}

	private void pLUDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void PLU_ComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		try
		{
			ctPLU = (int)PLU_ComboBox.SelectedValue;
		}
		catch (Exception)
		{
			Unit_ComboBox.SelectedIndex = -1;
			return;
		}
		if (!pLUBindingSource2_CurrentChanging)
		{
			int num = pLUBindingSource2.Find("PLUID", ctPLU);
			if (num != -1)
			{
				pLUBindingSource2.Position = num;
			}
		}
		ECSDataSet.PLURow pLURow = ecsDataSet.PLU.FindByPLUID((int)PLU_ComboBox.SelectedValue);
		if (pLURow == null)
		{
			Unit_ComboBox.SelectedIndex = -1;
			ctplu_priceout = (ctplu_pricein = 0m);
			return;
		}
		int num2 = ((pLURow.UnitID <= 1) ? 3 : ((pLURow.UnitID < 20) ? pLURow.UnitID : 2));
		ctplu_priceout = pLURow.Price;
		ctplu_pricein = pLURow.Cost;
		ECSDataSet.UnitRow unitRow = ecsDataSet.Unit.FindByUnitID(num2);
		if (unitRow != null)
		{
			Unit_ComboBox.SelectedValue = num2;
		}
		else
		{
			Unit_ComboBox.SelectedIndex = -1;
		}
		UnitPrice_Update();
		escal();
	}

	private ECSDataSet.PLURow GetCurrentPLU2Row()
	{
		if (pLUBindingSource2.Position == -1)
		{
			return null;
		}
		DataRowView dataRowView = (DataRowView)pLUBindingSource2.Current;
		return (ECSDataSet.PLURow)dataRowView.Row;
	}

	private void pLUBindingSource2_CurrentChanged(object sender, EventArgs e)
	{
		if (!pLUBindingSource2_CurrentChanging)
		{
			ECSDataSet.PLURow currentPLU2Row = GetCurrentPLU2Row();
			if (currentPLU2Row != null)
			{
				pLUBindingSource2_CurrentChanging = true;
				PLU_ComboBox.SelectedValue = currentPLU2Row.PLUID;
				pLUBindingSource2_CurrentChanging = false;
			}
		}
	}

	private void bindingNavigatorID_KeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode == Keys.Return)
		{
			e.Handled = true;
			bindingNavigatorGoto_Click(null, null);
		}
	}

	private void numberToolStripMenuItem_Click(object sender, EventArgs e)
	{
		if (sender == numberToolStripMenuItem)
		{
			numberToolStripMenuItem.Checked = true;
			indexToolStripMenuItem.Checked = false;
			itemCodeToolStripMenuItem.Checked = false;
			nameToolStripMenuItem.Checked = false;
		}
		else if (sender == indexToolStripMenuItem)
		{
			numberToolStripMenuItem.Checked = false;
			indexToolStripMenuItem.Checked = true;
			itemCodeToolStripMenuItem.Checked = false;
			nameToolStripMenuItem.Checked = false;
		}
		else if (sender == itemCodeToolStripMenuItem)
		{
			numberToolStripMenuItem.Checked = false;
			indexToolStripMenuItem.Checked = false;
			itemCodeToolStripMenuItem.Checked = true;
			nameToolStripMenuItem.Checked = false;
		}
		else if (sender == nameToolStripMenuItem)
		{
			numberToolStripMenuItem.Checked = false;
			indexToolStripMenuItem.Checked = false;
			itemCodeToolStripMenuItem.Checked = false;
			nameToolStripMenuItem.Checked = true;
		}
	}

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.StockItemForm));
		System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle = new System.Windows.Forms.DataGridViewCellStyle();
		this.pluTableAdapter = new ECS.ECSDataSetTableAdapters.PLUTableAdapter();
		this.sGroupTableAdapter = new ECS.ReportDataSetTableAdapters.SGroupTableAdapter();
		this.okButton = new System.Windows.Forms.Button();
		this.cancelButton = new System.Windows.Forms.Button();
		this.SGroup_ComboBox = new System.Windows.Forms.ComboBox();
		this.sGourpBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.reportDataSet = new ECS.ReportDataSet();
		this.sGroup_Label = new System.Windows.Forms.Label();
		this.PLU_Label = new System.Windows.Forms.Label();
		this.PLU_ComboBox = new System.Windows.Forms.ComboBox();
		this.pLUBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.ecsDataSet = new ECS.ECSDataSet();
		this.Type_ComboBox = new System.Windows.Forms.ComboBox();
		this.Type_Label = new System.Windows.Forms.Label();
		this.Amount_Label = new System.Windows.Forms.Label();
		this.Unit_ComboBox = new System.Windows.Forms.ComboBox();
		this.unitBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.Unit_Label = new System.Windows.Forms.Label();
		this.Total_Label = new System.Windows.Forms.Label();
		this.ES_Label = new System.Windows.Forms.Label();
		this.uiDataSet = new ECS.UIDataSet();
		this.UnitPrice_Label = new System.Windows.Forms.Label();
		this.stockTableAdapter = new ECS.ReportDataSetTableAdapters.StockTableAdapter();
		this.Amount_TextBox = new System.Windows.Forms.TextBox();
		this.UnitPrice_TextBox = new System.Windows.Forms.TextBox();
		this.Total_TextBox = new System.Windows.Forms.TextBox();
		this.ES_TextBox = new System.Windows.Forms.TextBox();
		this.splitContainer1 = new System.Windows.Forms.SplitContainer();
		this.pLUDataGridView = new System.Windows.Forms.DataGridView();
		this.pluidTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.itemcodeTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.indexTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.nameTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitComboBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.unitBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.priceTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.costTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUBindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.pLUBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorID = new System.Windows.Forms.ToolStripTextBox();
		this.gotoType_ToolStripDropDownButton = new System.Windows.Forms.ToolStripDropDownButton();
		this.numberToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.itemCodeToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.indexToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.nameToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.bindingNavigatorGoto = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorFilter = new System.Windows.Forms.ToolStripButton();
		this.FilterAdd_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		((System.ComponentModel.ISupportInitialize)this.sGourpBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		this.splitContainer1.Panel1.SuspendLayout();
		this.splitContainer1.Panel2.SuspendLayout();
		this.splitContainer1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.pLUDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingSource2).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingNavigator).BeginInit();
		this.pLUBindingNavigator.SuspendLayout();
		base.SuspendLayout();
		this.pluTableAdapter.ClearBeforeFill = true;
		this.sGroupTableAdapter.ClearBeforeFill = true;
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.Name = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		this.SGroup_ComboBox.DataSource = this.sGourpBindingSource;
		this.SGroup_ComboBox.DisplayMember = "Name";
		resources.ApplyResources(this.SGroup_ComboBox, "SGroup_ComboBox");
		this.SGroup_ComboBox.FormattingEnabled = true;
		this.SGroup_ComboBox.Name = "SGroup_ComboBox";
		this.SGroup_ComboBox.ValueMember = "GID";
		this.SGroup_ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(SGroup_ComboBox_Format);
		this.sGourpBindingSource.AllowNew = true;
		this.sGourpBindingSource.DataMember = "SGroup";
		this.sGourpBindingSource.DataSource = this.reportDataSet;
		this.sGourpBindingSource.Filter = "";
		this.reportDataSet.DataSetName = "ReportDataSet";
		this.reportDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.sGroup_Label, "sGroup_Label");
		this.sGroup_Label.Name = "sGroup_Label";
		resources.ApplyResources(this.PLU_Label, "PLU_Label");
		this.PLU_Label.Name = "PLU_Label";
		this.PLU_ComboBox.DataSource = this.pLUBindingSource;
		this.PLU_ComboBox.DisplayMember = "Name";
		this.PLU_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.PLU_ComboBox, "PLU_ComboBox");
		this.PLU_ComboBox.Name = "PLU_ComboBox";
		this.PLU_ComboBox.ValueMember = "PLUID";
		this.PLU_ComboBox.SelectedIndexChanged += new System.EventHandler(PLU_ComboBox_SelectedIndexChanged);
		this.PLU_ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(PLU_ComboBox_Format);
		this.pLUBindingSource.DataMember = "PLU";
		this.pLUBindingSource.DataSource = this.ecsDataSet;
		this.pLUBindingSource.Filter = "";
		this.ecsDataSet.DataSetName = "ECSDataSet";
		this.ecsDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.Type_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.Type_ComboBox, "Type_ComboBox");
		this.Type_ComboBox.Name = "Type_ComboBox";
		this.Type_ComboBox.SelectedIndexChanged += new System.EventHandler(Type_ComboBox_SelectedIndexChanged);
		resources.ApplyResources(this.Type_Label, "Type_Label");
		this.Type_Label.Name = "Type_Label";
		resources.ApplyResources(this.Amount_Label, "Amount_Label");
		this.Amount_Label.Name = "Amount_Label";
		this.Unit_ComboBox.DataSource = this.unitBindingSource;
		this.Unit_ComboBox.DisplayMember = "Name";
		this.Unit_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.Unit_ComboBox, "Unit_ComboBox");
		this.Unit_ComboBox.Name = "Unit_ComboBox";
		this.Unit_ComboBox.ValueMember = "UnitID";
		this.Unit_ComboBox.SelectedIndexChanged += new System.EventHandler(Unit_ComboBox_SelectedIndexChanged);
		this.Unit_ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(Unit_ComboBox_Format);
		this.unitBindingSource.DataMember = "Unit";
		this.unitBindingSource.DataSource = this.ecsDataSet;
		this.unitBindingSource.Filter = "UnitID > 1 AND UnitID < 20";
		resources.ApplyResources(this.Unit_Label, "Unit_Label");
		this.Unit_Label.Name = "Unit_Label";
		resources.ApplyResources(this.Total_Label, "Total_Label");
		this.Total_Label.Name = "Total_Label";
		resources.ApplyResources(this.ES_Label, "ES_Label");
		this.ES_Label.Name = "ES_Label";
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.UnitPrice_Label, "UnitPrice_Label");
		this.UnitPrice_Label.Name = "UnitPrice_Label";
		this.stockTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this.Amount_TextBox, "Amount_TextBox");
		this.Amount_TextBox.Name = "Amount_TextBox";
		this.Amount_TextBox.TextChanged += new System.EventHandler(Amount_TextBox_TextChanged);
		this.Amount_TextBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(Amount_TextBox_KeyPress);
		this.Amount_TextBox.Validating += new System.ComponentModel.CancelEventHandler(Amount_TextBox_Validating);
		resources.ApplyResources(this.UnitPrice_TextBox, "UnitPrice_TextBox");
		this.UnitPrice_TextBox.Name = "UnitPrice_TextBox";
		this.UnitPrice_TextBox.TextChanged += new System.EventHandler(UnitPrice_TextBox_TextChanged);
		this.UnitPrice_TextBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(UnitPrice_TextBox_KeyPress);
		this.UnitPrice_TextBox.Validating += new System.ComponentModel.CancelEventHandler(UnitPrice_TextBox_Validating);
		resources.ApplyResources(this.Total_TextBox, "Total_TextBox");
		this.Total_TextBox.Name = "Total_TextBox";
		resources.ApplyResources(this.ES_TextBox, "ES_TextBox");
		this.ES_TextBox.Name = "ES_TextBox";
		resources.ApplyResources(this.splitContainer1, "splitContainer1");
		this.splitContainer1.Name = "splitContainer1";
		this.splitContainer1.Panel1.Controls.Add(this.sGroup_Label);
		this.splitContainer1.Panel1.Controls.Add(this.ES_TextBox);
		this.splitContainer1.Panel1.Controls.Add(this.cancelButton);
		this.splitContainer1.Panel1.Controls.Add(this.Total_TextBox);
		this.splitContainer1.Panel1.Controls.Add(this.okButton);
		this.splitContainer1.Panel1.Controls.Add(this.UnitPrice_TextBox);
		this.splitContainer1.Panel1.Controls.Add(this.SGroup_ComboBox);
		this.splitContainer1.Panel1.Controls.Add(this.Amount_TextBox);
		this.splitContainer1.Panel1.Controls.Add(this.PLU_ComboBox);
		this.splitContainer1.Panel1.Controls.Add(this.UnitPrice_Label);
		this.splitContainer1.Panel1.Controls.Add(this.Type_ComboBox);
		this.splitContainer1.Panel1.Controls.Add(this.ES_Label);
		this.splitContainer1.Panel1.Controls.Add(this.Unit_ComboBox);
		this.splitContainer1.Panel1.Controls.Add(this.Total_Label);
		this.splitContainer1.Panel1.Controls.Add(this.PLU_Label);
		this.splitContainer1.Panel1.Controls.Add(this.Amount_Label);
		this.splitContainer1.Panel1.Controls.Add(this.Type_Label);
		this.splitContainer1.Panel1.Controls.Add(this.Unit_Label);
		this.splitContainer1.Panel2.Controls.Add(this.pLUDataGridView);
		this.splitContainer1.Panel2.Controls.Add(this.pLUBindingNavigator);
		this.pLUDataGridView.AllowUserToAddRows = false;
		this.pLUDataGridView.AutoGenerateColumns = false;
		this.pLUDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.pLUDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.pLUDataGridView, "pLUDataGridView");
		this.pLUDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.pLUDataGridView.Columns.AddRange(this.pluidTextBoxColumn, this.itemcodeTextBoxColumn, this.indexTextBoxColumn, this.nameTextBoxColumn, this.unitComboBoxColumn, this.priceTextBoxColumn, this.costTextBoxColumn);
		this.pLUDataGridView.DataSource = this.pLUBindingSource2;
		this.pLUDataGridView.Name = "pLUDataGridView";
		this.pLUDataGridView.ReadOnly = true;
		this.pLUDataGridView.RowTemplate.Height = 23;
		this.pLUDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.pLUDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(pLUDataGridView_DataError);
		this.pluidTextBoxColumn.DataPropertyName = "PLUID";
		this.pluidTextBoxColumn.Frozen = true;
		resources.ApplyResources(this.pluidTextBoxColumn, "pluidTextBoxColumn");
		this.pluidTextBoxColumn.Name = "pluidTextBoxColumn";
		this.pluidTextBoxColumn.ReadOnly = true;
		this.itemcodeTextBoxColumn.DataPropertyName = "Remark";
		resources.ApplyResources(this.itemcodeTextBoxColumn, "itemcodeTextBoxColumn");
		this.itemcodeTextBoxColumn.Name = "itemcodeTextBoxColumn";
		this.itemcodeTextBoxColumn.ReadOnly = true;
		this.indexTextBoxColumn.DataPropertyName = "Index";
		resources.ApplyResources(this.indexTextBoxColumn, "indexTextBoxColumn");
		this.indexTextBoxColumn.Name = "indexTextBoxColumn";
		this.indexTextBoxColumn.ReadOnly = true;
		this.nameTextBoxColumn.DataPropertyName = "Name";
		resources.ApplyResources(this.nameTextBoxColumn, "nameTextBoxColumn");
		this.nameTextBoxColumn.Name = "nameTextBoxColumn";
		this.nameTextBoxColumn.ReadOnly = true;
		this.unitComboBoxColumn.DataPropertyName = "UnitID";
		this.unitComboBoxColumn.DataSource = this.unitBindingSource2;
		this.unitComboBoxColumn.DisplayMember = "Name";
		resources.ApplyResources(this.unitComboBoxColumn, "unitComboBoxColumn");
		this.unitComboBoxColumn.Name = "unitComboBoxColumn";
		this.unitComboBoxColumn.ReadOnly = true;
		this.unitComboBoxColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.unitComboBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.unitComboBoxColumn.ValueMember = "UnitID";
		this.unitBindingSource2.DataMember = "Unit";
		this.unitBindingSource2.DataSource = this.ecsDataSet;
		this.unitBindingSource2.Filter = "";
		this.priceTextBoxColumn.DataPropertyName = "Price";
		dataGridViewCellStyle.NullValue = null;
		this.priceTextBoxColumn.DefaultCellStyle = dataGridViewCellStyle;
		resources.ApplyResources(this.priceTextBoxColumn, "priceTextBoxColumn");
		this.priceTextBoxColumn.Name = "priceTextBoxColumn";
		this.priceTextBoxColumn.ReadOnly = true;
		this.costTextBoxColumn.DataPropertyName = "Cost";
		resources.ApplyResources(this.costTextBoxColumn, "costTextBoxColumn");
		this.costTextBoxColumn.Name = "costTextBoxColumn";
		this.costTextBoxColumn.ReadOnly = true;
		this.pLUBindingSource2.DataMember = "PLU";
		this.pLUBindingSource2.DataSource = this.ecsDataSet;
		this.pLUBindingSource2.Filter = "";
		this.pLUBindingSource2.CurrentChanged += new System.EventHandler(pLUBindingSource2_CurrentChanged);
		this.pLUBindingNavigator.AddNewItem = null;
		this.pLUBindingNavigator.BindingSource = this.pLUBindingSource2;
		this.pLUBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.pLUBindingNavigator.DeleteItem = null;
		this.pLUBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[14]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorID,
			this.gotoType_ToolStripDropDownButton, this.bindingNavigatorGoto, this.bindingNavigatorFilter, this.FilterAdd_ToolStripButton
		});
		resources.ApplyResources(this.pLUBindingNavigator, "pLUBindingNavigator");
		this.pLUBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.pLUBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.pLUBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.pLUBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.pLUBindingNavigator.Name = "pLUBindingNavigator";
		this.pLUBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		resources.ApplyResources(this.bindingNavigatorCountItem, "bindingNavigatorCountItem");
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
		this.bindingNavigatorID.Name = "bindingNavigatorID";
		resources.ApplyResources(this.bindingNavigatorID, "bindingNavigatorID");
		this.bindingNavigatorID.KeyDown += new System.Windows.Forms.KeyEventHandler(bindingNavigatorID_KeyDown);
		this.gotoType_ToolStripDropDownButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.None;
		this.gotoType_ToolStripDropDownButton.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[4] { this.numberToolStripMenuItem, this.itemCodeToolStripMenuItem, this.indexToolStripMenuItem, this.nameToolStripMenuItem });
		resources.ApplyResources(this.gotoType_ToolStripDropDownButton, "gotoType_ToolStripDropDownButton");
		this.gotoType_ToolStripDropDownButton.Name = "gotoType_ToolStripDropDownButton";
		this.numberToolStripMenuItem.Checked = true;
		this.numberToolStripMenuItem.CheckState = System.Windows.Forms.CheckState.Checked;
		this.numberToolStripMenuItem.Name = "numberToolStripMenuItem";
		resources.ApplyResources(this.numberToolStripMenuItem, "numberToolStripMenuItem");
		this.numberToolStripMenuItem.Click += new System.EventHandler(numberToolStripMenuItem_Click);
		this.itemCodeToolStripMenuItem.Name = "itemCodeToolStripMenuItem";
		resources.ApplyResources(this.itemCodeToolStripMenuItem, "itemCodeToolStripMenuItem");
		this.itemCodeToolStripMenuItem.Click += new System.EventHandler(numberToolStripMenuItem_Click);
		this.indexToolStripMenuItem.Name = "indexToolStripMenuItem";
		resources.ApplyResources(this.indexToolStripMenuItem, "indexToolStripMenuItem");
		this.indexToolStripMenuItem.Click += new System.EventHandler(numberToolStripMenuItem_Click);
		this.nameToolStripMenuItem.Name = "nameToolStripMenuItem";
		resources.ApplyResources(this.nameToolStripMenuItem, "nameToolStripMenuItem");
		this.nameToolStripMenuItem.Click += new System.EventHandler(numberToolStripMenuItem_Click);
		this.bindingNavigatorGoto.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorGoto.Image = ECS.Properties.Resources.bindingNavigatorGoto;
		resources.ApplyResources(this.bindingNavigatorGoto, "bindingNavigatorGoto");
		this.bindingNavigatorGoto.Name = "bindingNavigatorGoto";
		this.bindingNavigatorGoto.Click += new System.EventHandler(bindingNavigatorGoto_Click);
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
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer1);
		base.Name = "StockItemForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(StockItemForm_Load);
		((System.ComponentModel.ISupportInitialize)this.sGourpBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		this.splitContainer1.Panel1.ResumeLayout(false);
		this.splitContainer1.Panel1.PerformLayout();
		this.splitContainer1.Panel2.ResumeLayout(false);
		this.splitContainer1.Panel2.PerformLayout();
		this.splitContainer1.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.pLUDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingSource2).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingNavigator).EndInit();
		this.pLUBindingNavigator.ResumeLayout(false);
		this.pLUBindingNavigator.PerformLayout();
		base.ResumeLayout(false);
	}
}
