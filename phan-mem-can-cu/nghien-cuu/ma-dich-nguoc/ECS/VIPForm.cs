using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class VIPForm : Form
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

	private delegate void DataSet_RefreshCallback(string Type);

	private int AutoID;

	private SimComboVD_No[] ctC3;

	private bool NoCTRowChanged;

	private bool DataSet_Changed;

	private IContainer components;

	private ToolStripButton bindingNavigatorMoveLastItem;

	private ToolStripButton bindingNavigatorMoveNextItem;

	private ToolStripSeparator bindingNavigatorSeparator1;

	private ToolStripTextBox bindingNavigatorPositionItem;

	private ToolStripSeparator bindingNavigatorSeparator;

	private ToolStripSeparator bindingNavigatorSeparator2;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripButton P0_Ethernet_toolStripButton;

	private ToolStripButton P0_TMSFile_toolStripButton;

	private ToolStripButton bindingNavigatorFilter;

	private ToolStripButton bindingNavigatorGoto;

	private ToolStripTextBox bindingNavigatorID;

	private ToolStripButton bindingNavigatorMovePreviousItem;

	private ToolStripButton bindingNavigatorMoveFirstItem;

	private ToolStripButton bindingNavigatorDeleteItem;

	private BindingSource vipBindingSource;

	private ECSDataSet eCSDataSet;

	private DataGridView vipDataGridView;

	private SplitContainer splitContainer;

	private ToolStripLabel bindingNavigatorCountItem;

	private ToolStripButton bindingNavigatorAddNewItem;

	private BindingNavigator vipBindingNavigator;

	private VIPTableAdapter vipTableAdapter;

	private NumericUpDown vip_Discount_NumericUpDown;

	private NumericUpDown vip_Point_NumericUpDown;

	private DataGridViewTextBoxColumn bARDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn pHDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn pointDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn discountDataGridViewTextBoxColumn;

	private TextBox vip_Ph_TextBox;

	private TextBox vip_Bar_TextBox;

	private ComboBox vip_DiscountInput_ComboBox;

	private UIDataSet uiDataSet;

	private NumericUpDown vip_DiscountInput_NumericUpDown;

	private Label vipPh_Label;

	private Label vipBar_Label;

	private Label vipDiscount_Label;

	private Label vipPoint_Label;

	public VIPForm()
	{
		InitializeComponent();
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
		}
		else if (Type == "VIP")
		{
			NoCTRowChanged = true;
			eCSDataSet.Dept.Clear();
			vipTableAdapter.Fill(eCSDataSet.VIP);
			vipBindingSource.ResetBindings(metadataChanged: false);
			NoCTRowChanged = false;
		}
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "VIPForm");
	}

	private void VIPForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_VIP");
		bARDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_PrimaryID");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorFilter.Text = Program.GetLang("pw_Filter");
		bindingNavigatorGoto.Text = Program.GetLang("pw_Switchto");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		discountDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Discount_pct_");
		P0_Ethernet_toolStripButton.Text = Program.GetLang("pw_Ethernet");
		P0_TMSFile_toolStripButton.Text = Program.GetLang("pw_TMSFile");
		pHDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_AssistID");
		pointDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Points");
		vipBar_Label.Text = Program.GetLang("pw_PrimaryID") + ":";
		vipDiscount_Label.Text = Program.GetLang("pw_Discount_pct_") + ":";
		vipPh_Label.Text = Program.GetLang("pw_AssistID") + ":";
		vipPoint_Label.Text = Program.GetLang("pw_Points") + ":";
		Font = Settings.Default.CustomFont;
		string fileName = Application.StartupPath + "\\Combo.xml";
		uiDataSet.SimCombo.ReadXml(fileName);
		Program.LabelRight_SetXLocaltion(new Label[4] { vipBar_Label, vipPh_Label, vipPoint_Label, vipDiscount_Label }, new Control[6] { vip_Bar_TextBox, vip_Ph_TextBox, vip_Point_NumericUpDown, vip_DiscountInput_ComboBox, vip_Discount_NumericUpDown, vip_DiscountInput_NumericUpDown });
		vipTableAdapter.Fill(eCSDataSet.VIP);
		vipTableAdapter.Fill(eCSDataSet.VIP);
		eCSDataSet.VIP.VIPRowChanged += VIP_VIPRowChanged;
		pointDataGridViewTextBoxColumn.DefaultCellStyle.Format = "F" + Settings.Default.Format_Price;
		string valueDisplay = uiDataSet.SimCombo.FindByName("VIP Discount Sort").ValueDisplay;
		string[] array = valueDisplay.Split('|');
		ctC3 = new SimComboVD_No[array.Length / 2];
		for (int i = 0; i < array.Length / 2; i++)
		{
			SimComboVD_No simComboVD_No = new SimComboVD_No();
			simComboVD_No.Value = int.Parse(array[i * 2]);
			simComboVD_No.Display = array[i * 2 + 1];
			ctC3[i] = simComboVD_No;
		}
		vip_DiscountInput_ComboBox.ValueMember = "Value";
		vip_DiscountInput_ComboBox.DisplayMember = "Display";
		vip_DiscountInput_ComboBox.DataSource = ctC3;
	}

	private void VIP_VIPRowChanged(object sender, ECSDataSet.VIPRowChangeEvent e)
	{
		if (NoCTRowChanged || e.Action == DataRowAction.Rollback || e.Action == DataRowAction.Commit)
		{
			return;
		}
		try
		{
			vipTableAdapter.Update(eCSDataSet.VIP);
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	public void SaveData()
	{
		Validate();
		try
		{
			vipBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			vipBindingSource.CancelEdit();
		}
		if (eCSDataSet.HasChanges())
		{
			try
			{
				vipTableAdapter.Update(eCSDataSet.VIP);
			}
			catch (Exception ex2)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void VIPForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		eCSDataSet.VIP.VIPRowChanged -= VIP_VIPRowChanged;
		Select(directed: true, forward: true);
		SaveData();
	}

	private void bindingNavigatorGoto_Click(object sender, EventArgs e)
	{
		if (bindingNavigatorID.Text.Length != 0)
		{
			int num = vipBindingSource.Find("Bar", bindingNavigatorID.Text);
			if (num != -1)
			{
				vipBindingSource.Position = num;
			}
		}
	}

	private void bindingNavigatorFilter_CheckedChanged(object sender, EventArgs e)
	{
		if (bindingNavigatorFilter.Checked)
		{
			using (FilterForm filterForm = new FilterForm(vipDataGridView))
			{
				if (filterForm.ShowDialog(this) == DialogResult.OK)
				{
					vipBindingSource.Filter = filterForm.FilterString;
				}
				else
				{
					bindingNavigatorFilter.Checked = false;
				}
				return;
			}
		}
		vipBindingSource.RemoveFilter();
	}

	private void vipDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void vipBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
	{
		if (e.BindingCompleteContext == BindingCompleteContext.DataSourceUpdate)
		{
			BindingSource bindingSource = sender as BindingSource;
			try
			{
				bindingSource.EndEdit();
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				bindingSource.CancelEdit();
			}
		}
	}

	private void P0_TMSFile_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.ShowDialog_TMSfile_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false, VIP: true);
	}

	private void P0_Ethernet_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.PopMdiChild_Ethernet_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false, VIP: true);
		if (Program.mf.m_netForm.mf_Docked)
		{
			base.WindowState = FormWindowState.Normal;
			Close();
		}
	}

	private void vip_Ph_TextBox_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar != '\b' && e.KeyChar != '\u0016' && e.KeyChar != '\u0003' && (e.KeyChar < '0' || e.KeyChar > '9'))
		{
			e.Handled = true;
		}
	}

	private void vip_Bar_TextBox_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar != '\b' && e.KeyChar != '\u0016' && e.KeyChar != '\u0003' && (e.KeyChar < '0' || e.KeyChar > '9'))
		{
			e.Handled = true;
		}
	}

	private void bindingNavigatorAddNewItem_Click(object sender, EventArgs e)
	{
		Validate();
		try
		{
			vipDataGridView.EndEdit();
			vipBindingSource.EndEdit();
			int num = 10000;
			string text;
			do
			{
				num--;
				AutoID++;
				text = AutoID.ToString();
			}
			while (eCSDataSet.VIP.FindByBAR(text) != null && num > 0);
			ECSDataSet.VIPRow vIPRow = eCSDataSet.VIP.NewVIPRow();
			vIPRow.BAR = text;
			eCSDataSet.VIP.AddVIPRow(vIPRow);
			int num2 = vipBindingSource.Find("BAR", text);
			if (num2 != -1)
			{
				vipBindingSource.Position = num2;
			}
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			vipBindingSource.CancelEdit();
		}
	}

	private void vip_Bar_TextBox_TextChanged(object sender, EventArgs e)
	{
		char[] trimChars = new char[2] { ' ', '0' };
		vip_Bar_TextBox.Text = vip_Bar_TextBox.Text.TrimStart(trimChars);
	}

	private void vip_Ph_TextBox_TextChanged(object sender, EventArgs e)
	{
		char[] trimChars = new char[2] { ' ', '0' };
		vip_Ph_TextBox.Text = vip_Ph_TextBox.Text.TrimStart(trimChars);
	}

	private void vip_Discount_Value_Changed(object sender, EventArgs e)
	{
		if (sender == vip_DiscountInput_ComboBox)
		{
			if ((int)vip_DiscountInput_ComboBox.SelectedValue == 0)
			{
				vip_Discount_NumericUpDown.Value = 0m;
				vip_DiscountInput_NumericUpDown.Visible = false;
			}
			else if ((int)vip_DiscountInput_ComboBox.SelectedValue == 101)
			{
				vip_Discount_NumericUpDown.Value = 101m;
				vip_DiscountInput_NumericUpDown.Visible = false;
			}
			else if ((int)vip_DiscountInput_ComboBox.SelectedValue == 102)
			{
				vip_Discount_NumericUpDown.Value = 102m;
				vip_DiscountInput_NumericUpDown.Visible = false;
			}
			else if ((int)vip_DiscountInput_ComboBox.SelectedValue == 103)
			{
				vip_Discount_NumericUpDown.Value = 103m;
				vip_DiscountInput_NumericUpDown.Visible = false;
			}
			else if ((int)vip_DiscountInput_ComboBox.SelectedValue == 104)
			{
				vip_Discount_NumericUpDown.Value = 104m;
				vip_DiscountInput_NumericUpDown.Visible = false;
			}
			else if ((int)vip_DiscountInput_ComboBox.SelectedValue == 1)
			{
				if (vip_Discount_NumericUpDown.Value < 0m && vip_Discount_NumericUpDown.Value > 99m)
				{
					NumericUpDown numericUpDown = vip_Discount_NumericUpDown;
					decimal value = (vip_DiscountInput_NumericUpDown.Value = 1m);
					numericUpDown.Value = value;
				}
				vip_DiscountInput_NumericUpDown.Visible = true;
			}
		}
		else if (sender == vip_DiscountInput_NumericUpDown)
		{
			vip_Discount_NumericUpDown.Value = vip_DiscountInput_NumericUpDown.Value;
		}
		else if (sender == vip_Discount_NumericUpDown)
		{
			if (vip_Discount_NumericUpDown.Value == 0m)
			{
				vip_DiscountInput_ComboBox.SelectedValue = 0;
			}
			else if (vip_Discount_NumericUpDown.Value == 101m)
			{
				vip_DiscountInput_ComboBox.SelectedValue = 101;
			}
			else if (vip_Discount_NumericUpDown.Value == 102m)
			{
				vip_DiscountInput_ComboBox.SelectedValue = 102;
			}
			else if (vip_Discount_NumericUpDown.Value == 103m)
			{
				vip_DiscountInput_ComboBox.SelectedValue = 103;
			}
			else if (vip_Discount_NumericUpDown.Value == 104m)
			{
				vip_DiscountInput_ComboBox.SelectedValue = 104;
			}
			else if (vip_Discount_NumericUpDown.Value < 100m)
			{
				vip_DiscountInput_ComboBox.SelectedValue = 1;
				vip_DiscountInput_NumericUpDown.Value = vip_Discount_NumericUpDown.Value;
			}
			else
			{
				vip_DiscountInput_ComboBox.SelectedValue = 0;
			}
		}
	}

	private void DeleteSelect()
	{
		foreach (DataGridViewRow selectedRow in vipDataGridView.SelectedRows)
		{
			if (selectedRow.DataBoundItem is DataRowView dataRowView)
			{
				dataRowView.Row.Delete();
			}
		}
		try
		{
			vipTableAdapter.Update(eCSDataSet.VIP);
			DataSet_Changed = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void bindingNavigatorDeleteItem_Click(object sender, EventArgs e)
	{
		DeleteSelect();
	}

	private void vipDataGridView_KeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode == Keys.Delete)
		{
			e.Handled = true;
			DeleteSelect();
		}
	}

	private void VIPForm_Leave(object sender, EventArgs e)
	{
		vipDataGridView.EndEdit();
		vipBindingSource.EndEdit();
		if (DataSet_Changed)
		{
			DataSet_Update("VIP");
			DataSet_Changed = false;
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.VIPForm));
		this.vipPh_Label = new System.Windows.Forms.Label();
		this.splitContainer = new System.Windows.Forms.SplitContainer();
		this.vipDataGridView = new System.Windows.Forms.DataGridView();
		this.bARDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pHDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pointDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.discountDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.vipBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.eCSDataSet = new ECS.ECSDataSet();
		this.vip_DiscountInput_ComboBox = new System.Windows.Forms.ComboBox();
		this.vip_Ph_TextBox = new System.Windows.Forms.TextBox();
		this.vip_Bar_TextBox = new System.Windows.Forms.TextBox();
		this.vipBar_Label = new System.Windows.Forms.Label();
		this.vip_DiscountInput_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.vip_Discount_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.vip_Point_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.vipDiscount_Label = new System.Windows.Forms.Label();
		this.vipPoint_Label = new System.Windows.Forms.Label();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.P0_Ethernet_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.P0_TMSFile_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorFilter = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorGoto = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorID = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.vipBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.vipTableAdapter = new ECS.ECSDataSetTableAdapters.VIPTableAdapter();
		this.uiDataSet = new ECS.UIDataSet();
		this.splitContainer.Panel1.SuspendLayout();
		this.splitContainer.Panel2.SuspendLayout();
		this.splitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.vipDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.vipBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.vip_DiscountInput_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.vip_Discount_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.vip_Point_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.vipBindingNavigator).BeginInit();
		this.vipBindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		base.SuspendLayout();
		resources.ApplyResources(this.vipPh_Label, "vipPh_Label");
		this.vipPh_Label.Name = "vipPh_Label";
		this.splitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer, "splitContainer");
		this.splitContainer.Name = "splitContainer";
		resources.ApplyResources(this.splitContainer.Panel1, "splitContainer.Panel1");
		this.splitContainer.Panel1.Controls.Add(this.vipDataGridView);
		resources.ApplyResources(this.splitContainer.Panel2, "splitContainer.Panel2");
		this.splitContainer.Panel2.Controls.Add(this.vip_DiscountInput_ComboBox);
		this.splitContainer.Panel2.Controls.Add(this.vip_Ph_TextBox);
		this.splitContainer.Panel2.Controls.Add(this.vip_Bar_TextBox);
		this.splitContainer.Panel2.Controls.Add(this.vipBar_Label);
		this.splitContainer.Panel2.Controls.Add(this.vip_DiscountInput_NumericUpDown);
		this.splitContainer.Panel2.Controls.Add(this.vip_Discount_NumericUpDown);
		this.splitContainer.Panel2.Controls.Add(this.vip_Point_NumericUpDown);
		this.splitContainer.Panel2.Controls.Add(this.vipDiscount_Label);
		this.splitContainer.Panel2.Controls.Add(this.vipPoint_Label);
		this.splitContainer.Panel2.Controls.Add(this.vipPh_Label);
		this.vipDataGridView.AllowUserToAddRows = false;
		this.vipDataGridView.AutoGenerateColumns = false;
		this.vipDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.vipDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.vipDataGridView.Columns.AddRange(this.bARDataGridViewTextBoxColumn, this.pHDataGridViewTextBoxColumn, this.pointDataGridViewTextBoxColumn, this.discountDataGridViewTextBoxColumn);
		this.vipDataGridView.DataSource = this.vipBindingSource;
		resources.ApplyResources(this.vipDataGridView, "vipDataGridView");
		this.vipDataGridView.Name = "vipDataGridView";
		this.vipDataGridView.RowTemplate.Height = 23;
		this.vipDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.vipDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(vipDataGridView_DataError);
		this.vipDataGridView.KeyDown += new System.Windows.Forms.KeyEventHandler(vipDataGridView_KeyDown);
		this.bARDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.bARDataGridViewTextBoxColumn.DataPropertyName = "BAR";
		resources.ApplyResources(this.bARDataGridViewTextBoxColumn, "bARDataGridViewTextBoxColumn");
		this.bARDataGridViewTextBoxColumn.Name = "bARDataGridViewTextBoxColumn";
		this.pHDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pHDataGridViewTextBoxColumn.DataPropertyName = "PH";
		resources.ApplyResources(this.pHDataGridViewTextBoxColumn, "pHDataGridViewTextBoxColumn");
		this.pHDataGridViewTextBoxColumn.Name = "pHDataGridViewTextBoxColumn";
		this.pointDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pointDataGridViewTextBoxColumn.DataPropertyName = "Point";
		resources.ApplyResources(this.pointDataGridViewTextBoxColumn, "pointDataGridViewTextBoxColumn");
		this.pointDataGridViewTextBoxColumn.Name = "pointDataGridViewTextBoxColumn";
		this.discountDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.discountDataGridViewTextBoxColumn.DataPropertyName = "Discount";
		resources.ApplyResources(this.discountDataGridViewTextBoxColumn, "discountDataGridViewTextBoxColumn");
		this.discountDataGridViewTextBoxColumn.Name = "discountDataGridViewTextBoxColumn";
		this.vipBindingSource.DataMember = "VIP";
		this.vipBindingSource.DataSource = this.eCSDataSet;
		this.vipBindingSource.Sort = "";
		this.vipBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(vipBindingSource_BindingComplete);
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.vip_DiscountInput_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.vip_DiscountInput_ComboBox, "vip_DiscountInput_ComboBox");
		this.vip_DiscountInput_ComboBox.Name = "vip_DiscountInput_ComboBox";
		this.vip_DiscountInput_ComboBox.SelectedIndexChanged += new System.EventHandler(vip_Discount_Value_Changed);
		this.vip_Ph_TextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.vipBindingSource, "PH", true));
		resources.ApplyResources(this.vip_Ph_TextBox, "vip_Ph_TextBox");
		this.vip_Ph_TextBox.Name = "vip_Ph_TextBox";
		this.vip_Ph_TextBox.TextChanged += new System.EventHandler(vip_Ph_TextBox_TextChanged);
		this.vip_Ph_TextBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(vip_Ph_TextBox_KeyPress);
		this.vip_Bar_TextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.vipBindingSource, "BAR", true));
		resources.ApplyResources(this.vip_Bar_TextBox, "vip_Bar_TextBox");
		this.vip_Bar_TextBox.Name = "vip_Bar_TextBox";
		this.vip_Bar_TextBox.TextChanged += new System.EventHandler(vip_Bar_TextBox_TextChanged);
		this.vip_Bar_TextBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(vip_Bar_TextBox_KeyPress);
		resources.ApplyResources(this.vipBar_Label, "vipBar_Label");
		this.vipBar_Label.Name = "vipBar_Label";
		resources.ApplyResources(this.vip_DiscountInput_NumericUpDown, "vip_DiscountInput_NumericUpDown");
		this.vip_DiscountInput_NumericUpDown.Maximum = new decimal(new int[4] { 99, 0, 0, 0 });
		this.vip_DiscountInput_NumericUpDown.Minimum = new decimal(new int[4] { 1, 0, 0, 0 });
		this.vip_DiscountInput_NumericUpDown.Name = "vip_DiscountInput_NumericUpDown";
		this.vip_DiscountInput_NumericUpDown.Value = new decimal(new int[4] { 1, 0, 0, 0 });
		this.vip_DiscountInput_NumericUpDown.ValueChanged += new System.EventHandler(vip_Discount_Value_Changed);
		this.vip_Discount_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.vipBindingSource, "Discount", true));
		resources.ApplyResources(this.vip_Discount_NumericUpDown, "vip_Discount_NumericUpDown");
		this.vip_Discount_NumericUpDown.Maximum = new decimal(new int[4] { 104, 0, 0, 0 });
		this.vip_Discount_NumericUpDown.Name = "vip_Discount_NumericUpDown";
		this.vip_Discount_NumericUpDown.ValueChanged += new System.EventHandler(vip_Discount_Value_Changed);
		this.vip_Point_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("DecimalPlaces", ECS.Properties.Settings.Default, "Format_Price", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.vip_Point_NumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.vipBindingSource, "Point", true));
		this.vip_Point_NumericUpDown.DecimalPlaces = ECS.Properties.Settings.Default.Format_Price;
		resources.ApplyResources(this.vip_Point_NumericUpDown, "vip_Point_NumericUpDown");
		this.vip_Point_NumericUpDown.Maximum = new decimal(new int[4] { 999999999, 0, 0, 131072 });
		this.vip_Point_NumericUpDown.Name = "vip_Point_NumericUpDown";
		resources.ApplyResources(this.vipDiscount_Label, "vipDiscount_Label");
		this.vipDiscount_Label.Name = "vipDiscount_Label";
		resources.ApplyResources(this.vipPoint_Label, "vipPoint_Label");
		this.vipPoint_Label.Name = "vipPoint_Label";
		this.bindingNavigatorMoveLastItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveLastItem.Image = ECS.Properties.Resources.bindingNavigatorMoveLastItem;
		this.bindingNavigatorMoveLastItem.Name = "bindingNavigatorMoveLastItem";
		resources.ApplyResources(this.bindingNavigatorMoveLastItem, "bindingNavigatorMoveLastItem");
		this.bindingNavigatorMoveNextItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveNextItem.Image = ECS.Properties.Resources.bindingNavigatorMoveNextItem;
		this.bindingNavigatorMoveNextItem.Name = "bindingNavigatorMoveNextItem";
		resources.ApplyResources(this.bindingNavigatorMoveNextItem, "bindingNavigatorMoveNextItem");
		this.bindingNavigatorSeparator1.Name = "bindingNavigatorSeparator1";
		resources.ApplyResources(this.bindingNavigatorSeparator1, "bindingNavigatorSeparator1");
		resources.ApplyResources(this.bindingNavigatorPositionItem, "bindingNavigatorPositionItem");
		this.bindingNavigatorPositionItem.Name = "bindingNavigatorPositionItem";
		this.bindingNavigatorSeparator.Name = "bindingNavigatorSeparator";
		resources.ApplyResources(this.bindingNavigatorSeparator, "bindingNavigatorSeparator");
		this.bindingNavigatorSeparator2.Name = "bindingNavigatorSeparator2";
		resources.ApplyResources(this.bindingNavigatorSeparator2, "bindingNavigatorSeparator2");
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		resources.ApplyResources(this.P0_Ethernet_toolStripButton, "P0_Ethernet_toolStripButton");
		this.P0_Ethernet_toolStripButton.Name = "P0_Ethernet_toolStripButton";
		this.P0_Ethernet_toolStripButton.Click += new System.EventHandler(P0_Ethernet_toolStripButton_Click);
		resources.ApplyResources(this.P0_TMSFile_toolStripButton, "P0_TMSFile_toolStripButton");
		this.P0_TMSFile_toolStripButton.Name = "P0_TMSFile_toolStripButton";
		this.P0_TMSFile_toolStripButton.Click += new System.EventHandler(P0_TMSFile_toolStripButton_Click);
		this.bindingNavigatorFilter.CheckOnClick = true;
		this.bindingNavigatorFilter.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorFilter.Image = ECS.Properties.Resources.bindingNavigatorFilter;
		resources.ApplyResources(this.bindingNavigatorFilter, "bindingNavigatorFilter");
		this.bindingNavigatorFilter.Name = "bindingNavigatorFilter";
		this.bindingNavigatorFilter.CheckedChanged += new System.EventHandler(bindingNavigatorFilter_CheckedChanged);
		this.bindingNavigatorGoto.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorGoto.Image = ECS.Properties.Resources.bindingNavigatorGoto;
		resources.ApplyResources(this.bindingNavigatorGoto, "bindingNavigatorGoto");
		this.bindingNavigatorGoto.Name = "bindingNavigatorGoto";
		this.bindingNavigatorGoto.Click += new System.EventHandler(bindingNavigatorGoto_Click);
		this.bindingNavigatorID.Name = "bindingNavigatorID";
		resources.ApplyResources(this.bindingNavigatorID, "bindingNavigatorID");
		this.bindingNavigatorMovePreviousItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMovePreviousItem.Image = ECS.Properties.Resources.bindingNavigatorMovePreviousItem;
		this.bindingNavigatorMovePreviousItem.Name = "bindingNavigatorMovePreviousItem";
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem, "bindingNavigatorMovePreviousItem");
		this.bindingNavigatorMoveFirstItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveFirstItem.Image = ECS.Properties.Resources.bindingNavigatorMoveFirstItem;
		this.bindingNavigatorMoveFirstItem.Name = "bindingNavigatorMoveFirstItem";
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem, "bindingNavigatorMoveFirstItem");
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorDeleteItem.Image = ECS.Properties.Resources.bindingNavigatorDeleteItem;
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
		this.bindingNavigatorDeleteItem.Click += new System.EventHandler(bindingNavigatorDeleteItem_Click);
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		resources.ApplyResources(this.bindingNavigatorCountItem, "bindingNavigatorCountItem");
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorAddNewItem.Image = ECS.Properties.Resources.bindingNavigatorAddNewItem;
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
		this.bindingNavigatorAddNewItem.Click += new System.EventHandler(bindingNavigatorAddNewItem_Click);
		this.vipBindingNavigator.AddNewItem = null;
		this.vipBindingNavigator.BindingSource = this.vipBindingSource;
		this.vipBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.vipBindingNavigator.DeleteItem = null;
		this.vipBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[17]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem, this.toolStripSeparator1, this.bindingNavigatorID, this.bindingNavigatorGoto, this.bindingNavigatorFilter, this.P0_TMSFile_toolStripButton, this.P0_Ethernet_toolStripButton
		});
		resources.ApplyResources(this.vipBindingNavigator, "vipBindingNavigator");
		this.vipBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.vipBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.vipBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.vipBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.vipBindingNavigator.Name = "vipBindingNavigator";
		this.vipBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.vipTableAdapter.ClearBeforeFill = true;
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer);
		base.Controls.Add(this.vipBindingNavigator);
		base.Name = "VIPForm";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(VIPForm_FormClosing);
		base.Load += new System.EventHandler(VIPForm_Load);
		base.Leave += new System.EventHandler(VIPForm_Leave);
		this.splitContainer.Panel1.ResumeLayout(false);
		this.splitContainer.Panel2.ResumeLayout(false);
		this.splitContainer.Panel2.PerformLayout();
		this.splitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.vipDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.vipBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.vip_DiscountInput_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.vip_Discount_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.vip_Point_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.vipBindingNavigator).EndInit();
		this.vipBindingNavigator.ResumeLayout(false);
		this.vipBindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
