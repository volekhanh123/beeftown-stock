using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class CustomForm : Form
{
	private delegate void DataSet_RefreshCallback(string Type);

	private IContainer components;

	private ECSDataSet ecsDataSet;

	private BindingSource customBindingSource;

	private Custom1TableAdapter custom1TableAdapter;

	private DataGridView customDataGridView;

	private SplitContainer splitContainer;

	private Custom2TableAdapter custom2TableAdapter;

	private Custom3TableAdapter custom3TableAdapter;

	private Custom4TableAdapter custom4TableAdapter;

	private ToolStripButton bindingNavigatorMoveFirstItem;

	private ToolStripButton bindingNavigatorMovePreviousItem;

	private ToolStripSeparator bindingNavigatorSeparator;

	private ToolStripTextBox bindingNavigatorPositionItem;

	private ToolStripLabel bindingNavigatorCountItem;

	private ToolStripSeparator bindingNavigatorSeparator1;

	private ToolStripButton bindingNavigatorMoveNextItem;

	private ToolStripButton bindingNavigatorMoveLastItem;

	private ToolStripSeparator bindingNavigatorSeparator2;

	private ToolStripButton bindingNavigatorAddNewItem;

	private ToolStripButton bindingNavigatorDeleteItem;

	private BindingNavigator customBindingNavigator;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripTextBox bindingNavigatorID;

	private ToolStripButton bindingNavigatorGoto;

	private TableLayoutPanel tableLayoutPanel;

	private ToolStripButton bindingNavigatorFilter;

	private ToolStripButton P0_TMSFile_toolStripButton;

	private ToolStripButton P0_Ethernet_toolStripButton;

	private ToolStripButton cloneToolStripButton;

	private UIDataSet.CustomRow _customRow;

	private bool NoCTRowChanged;

	private bool DataSet_Changed;

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.CustomForm));
		this.splitContainer = new System.Windows.Forms.SplitContainer();
		this.customDataGridView = new System.Windows.Forms.DataGridView();
		this.customBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.ecsDataSet = new ECS.ECSDataSet();
		this.tableLayoutPanel = new System.Windows.Forms.TableLayoutPanel();
		this.custom1TableAdapter = new ECS.ECSDataSetTableAdapters.Custom1TableAdapter();
		this.custom2TableAdapter = new ECS.ECSDataSetTableAdapters.Custom2TableAdapter();
		this.custom3TableAdapter = new ECS.ECSDataSetTableAdapters.Custom3TableAdapter();
		this.custom4TableAdapter = new ECS.ECSDataSetTableAdapters.Custom4TableAdapter();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.customBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorID = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorGoto = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorFilter = new System.Windows.Forms.ToolStripButton();
		this.P0_TMSFile_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.P0_Ethernet_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.cloneToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.splitContainer.Panel1.SuspendLayout();
		this.splitContainer.Panel2.SuspendLayout();
		this.splitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.customDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.customBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.customBindingNavigator).BeginInit();
		this.customBindingNavigator.SuspendLayout();
		base.SuspendLayout();
		this.splitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer, "splitContainer");
		this.splitContainer.Name = "splitContainer";
		this.splitContainer.Panel1.Controls.Add(this.customDataGridView);
		resources.ApplyResources(this.splitContainer.Panel2, "splitContainer.Panel2");
		this.splitContainer.Panel2.Controls.Add(this.tableLayoutPanel);
		this.customDataGridView.AllowUserToAddRows = false;
		this.customDataGridView.AllowUserToDeleteRows = false;
		this.customDataGridView.AllowUserToOrderColumns = true;
		this.customDataGridView.AutoGenerateColumns = false;
		this.customDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.customDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.customDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.customDataGridView.DataSource = this.customBindingSource;
		resources.ApplyResources(this.customDataGridView, "customDataGridView");
		this.customDataGridView.Name = "customDataGridView";
		this.customDataGridView.RowTemplate.Height = 23;
		this.customDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.customDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(customDataGridView_DataError);
		this.customDataGridView.KeyDown += new System.Windows.Forms.KeyEventHandler(customDataGridView_KeyDown);
		this.customBindingSource.DataSource = this.ecsDataSet;
		this.customBindingSource.Position = 0;
		this.customBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(customBindingSource_BindingComplete);
		this.ecsDataSet.DataSetName = "ECSDataSet";
		this.ecsDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.tableLayoutPanel, "tableLayoutPanel");
		this.tableLayoutPanel.Name = "tableLayoutPanel";
		this.custom1TableAdapter.ClearBeforeFill = true;
		this.custom2TableAdapter.ClearBeforeFill = true;
		this.custom3TableAdapter.ClearBeforeFill = true;
		this.custom4TableAdapter.ClearBeforeFill = true;
		this.bindingNavigatorMoveFirstItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem, "bindingNavigatorMoveFirstItem");
		this.bindingNavigatorMoveFirstItem.Name = "bindingNavigatorMoveFirstItem";
		this.bindingNavigatorMovePreviousItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem, "bindingNavigatorMovePreviousItem");
		this.bindingNavigatorMovePreviousItem.Name = "bindingNavigatorMovePreviousItem";
		this.bindingNavigatorSeparator.Name = "bindingNavigatorSeparator";
		resources.ApplyResources(this.bindingNavigatorSeparator, "bindingNavigatorSeparator");
		resources.ApplyResources(this.bindingNavigatorPositionItem, "bindingNavigatorPositionItem");
		this.bindingNavigatorPositionItem.Name = "bindingNavigatorPositionItem";
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		resources.ApplyResources(this.bindingNavigatorCountItem, "bindingNavigatorCountItem");
		this.bindingNavigatorSeparator1.Name = "bindingNavigatorSeparator1";
		resources.ApplyResources(this.bindingNavigatorSeparator1, "bindingNavigatorSeparator1");
		this.bindingNavigatorMoveNextItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem, "bindingNavigatorMoveNextItem");
		this.bindingNavigatorMoveNextItem.Name = "bindingNavigatorMoveNextItem";
		this.bindingNavigatorMoveLastItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem, "bindingNavigatorMoveLastItem");
		this.bindingNavigatorMoveLastItem.Name = "bindingNavigatorMoveLastItem";
		this.bindingNavigatorSeparator2.Name = "bindingNavigatorSeparator2";
		resources.ApplyResources(this.bindingNavigatorSeparator2, "bindingNavigatorSeparator2");
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		this.bindingNavigatorDeleteItem.Click += new System.EventHandler(bindingNavigatorDeleteItem_Click);
		this.customBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem;
		this.customBindingNavigator.BindingSource = this.customBindingSource;
		this.customBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.customBindingNavigator.DeleteItem = null;
		this.customBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[18]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem, this.cloneToolStripButton, this.toolStripSeparator1, this.bindingNavigatorID, this.bindingNavigatorGoto, this.bindingNavigatorFilter, this.P0_TMSFile_toolStripButton, this.P0_Ethernet_toolStripButton
		});
		resources.ApplyResources(this.customBindingNavigator, "customBindingNavigator");
		this.customBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.customBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.customBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.customBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.customBindingNavigator.Name = "customBindingNavigator";
		this.customBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		this.bindingNavigatorID.Name = "bindingNavigatorID";
		resources.ApplyResources(this.bindingNavigatorID, "bindingNavigatorID");
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
		this.bindingNavigatorFilter.Click += new System.EventHandler(bindingNavigatorFilter_Click);
		resources.ApplyResources(this.P0_TMSFile_toolStripButton, "P0_TMSFile_toolStripButton");
		this.P0_TMSFile_toolStripButton.Name = "P0_TMSFile_toolStripButton";
		this.P0_TMSFile_toolStripButton.Click += new System.EventHandler(P0_TMSFile_toolStripButton_Click);
		resources.ApplyResources(this.P0_Ethernet_toolStripButton, "P0_Ethernet_toolStripButton");
		this.P0_Ethernet_toolStripButton.Name = "P0_Ethernet_toolStripButton";
		this.P0_Ethernet_toolStripButton.Click += new System.EventHandler(P0_Ethernet_toolStripButton_Click);
		resources.ApplyResources(this.cloneToolStripButton, "cloneToolStripButton");
		this.cloneToolStripButton.Name = "cloneToolStripButton";
		this.cloneToolStripButton.Click += new System.EventHandler(cloneToolStripButton_Click);
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer);
		base.Controls.Add(this.customBindingNavigator);
		base.Name = "CustomForm";
		base.FormClosed += new System.Windows.Forms.FormClosedEventHandler(CustomForm_FormClosed);
		base.Load += new System.EventHandler(CustomForm_Load);
		base.Leave += new System.EventHandler(CustomForm_Leave);
		this.splitContainer.Panel1.ResumeLayout(false);
		this.splitContainer.Panel2.ResumeLayout(false);
		this.splitContainer.Panel2.PerformLayout();
		this.splitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.customDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.customBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.customBindingNavigator).EndInit();
		this.customBindingNavigator.ResumeLayout(false);
		this.customBindingNavigator.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public CustomForm(UIDataSet.CustomRow customRow)
	{
		InitializeComponent();
		_customRow = customRow;
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
		}
		else if (Type == _customRow._Table)
		{
			customBindingSource.EndEdit();
			NoCTRowChanged = true;
			ecsDataSet.Clear();
			FillTable();
			customBindingSource.ResetBindings(metadataChanged: false);
			NoCTRowChanged = false;
		}
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, _customRow._Table + "Form");
	}

	private void CustomForm_Load(object sender, EventArgs e)
	{
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorFilter.Text = Program.GetLang("pw_Filter");
		bindingNavigatorGoto.Text = Program.GetLang("pw_Switchto");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		P0_Ethernet_toolStripButton.Text = Program.GetLang("pw_Ethernet");
		P0_TMSFile_toolStripButton.Text = Program.GetLang("pw_TMSFile");
		cloneToolStripButton.Text = Program.GetLang("pw_Clone");
		Font = Settings.Default.CustomFont;
		Text = _customRow.Display;
		customBindingSource.DataMember = _customRow._Table;
		CreateGrid();
		CreateDetail();
		FillTable();
		switch (_customRow._Table)
		{
		case "Custom1":
			if (ecsDataSet.Custom1.FindByID(0) == null)
			{
				ECSDataSet.Custom1Row custom1Row = ecsDataSet.Custom1.NewCustom1Row();
				custom1Row.ID = 0;
				ecsDataSet.Custom1.AddCustom1Row(custom1Row);
				custom1TableAdapter.Update(ecsDataSet.Custom1);
			}
			break;
		case "Custom2":
			if (ecsDataSet.Custom2.FindByID(0) == null)
			{
				ECSDataSet.Custom2Row custom2Row = ecsDataSet.Custom2.NewCustom2Row();
				custom2Row.ID = 0;
				ecsDataSet.Custom2.AddCustom2Row(custom2Row);
				custom2TableAdapter.Update(ecsDataSet.Custom2);
			}
			break;
		case "Custom3":
			if (ecsDataSet.Custom3.FindByID(0) == null)
			{
				ECSDataSet.Custom3Row custom3Row = ecsDataSet.Custom3.NewCustom3Row();
				custom3Row.ID = 0;
				ecsDataSet.Custom3.AddCustom3Row(custom3Row);
				custom3TableAdapter.Update(ecsDataSet.Custom3);
			}
			break;
		case "Custom4":
			if (ecsDataSet.Custom4.FindByID(0) == null)
			{
				ECSDataSet.Custom4Row custom4Row = ecsDataSet.Custom4.NewCustom4Row();
				custom4Row.ID = 0;
				ecsDataSet.Custom4.AddCustom4Row(custom4Row);
				custom4TableAdapter.Update(ecsDataSet.Custom4);
			}
			break;
		}
		customBindingSource.Filter = "ID >= 1";
		AddRowChanged();
	}

	public void SaveData()
	{
		Validate();
		customBindingSource.EndEdit();
		if (ecsDataSet.HasChanges())
		{
			UpdateTable();
		}
	}

	private void CustomForm_FormClosed(object sender, FormClosedEventArgs e)
	{
		RemoveRowChanged();
		Select(directed: true, forward: true);
		SaveData();
	}

	private List<Pair> SplitCommbo(string text, out string title)
	{
		string[] array = text.Split('|');
		title = array[0];
		List<Pair> list = new List<Pair>(array.Length / 2 + 1);
		for (int i = 1; i < array.Length; i += 2)
		{
			Pair item = new Pair(int.Parse(array[i]), array[i + 1]);
			list.Add(item);
		}
		return list;
	}

	private string SplitText(string text, out int rows)
	{
		string[] array = text.Split('|');
		rows = 0;
		if (array.Length > 1)
		{
			rows = Program.ParseInt(array[1]);
		}
		return array[0];
	}

	private string SplitNumber(string text, out int place, out int max, out int min)
	{
		string[] array = text.Split('|');
		place = 0;
		min = 0;
		max = 9999999;
		if (array.Length > 1)
		{
			place = Program.ParseInt(array[1]);
		}
		if (array.Length > 2)
		{
			max = Program.ParseInt(array[2], 9999999);
		}
		if (array.Length > 3)
		{
			min = Program.ParseInt(array[3]);
		}
		return array[0];
	}

	private DataGridViewTextBoxColumn CreateTextColumn(UIDataSet.CustomItemRow itemRow)
	{
		DataGridViewTextBoxColumn dataGridViewTextBoxColumn = new DataGridViewTextBoxColumn();
		dataGridViewTextBoxColumn.HeaderText = SplitText(itemRow.GridDisplay, out var _);
		return dataGridViewTextBoxColumn;
	}

	private DataGridViewComboBoxColumn CreateComboColumn(UIDataSet.CustomItemRow itemRow)
	{
		DataGridViewComboBoxColumn dataGridViewComboBoxColumn = new DataGridViewComboBoxColumn();
		dataGridViewComboBoxColumn.DisplayMember = "Display";
		dataGridViewComboBoxColumn.ValueMember = "Value";
		dataGridViewComboBoxColumn.DataSource = SplitCommbo(itemRow.GridDisplay, out var title);
		dataGridViewComboBoxColumn.HeaderText = title;
		return dataGridViewComboBoxColumn;
	}

	private DataGridViewTextBoxColumn CreateNumberColumn(UIDataSet.CustomItemRow itemRow)
	{
		DataGridViewTextBoxColumn dataGridViewTextBoxColumn = new DataGridViewTextBoxColumn();
		dataGridViewTextBoxColumn.HeaderText = SplitNumber(itemRow.GridDisplay, out var place, out var _, out var _);
		dataGridViewTextBoxColumn.DefaultCellStyle.Format = "F" + place;
		return dataGridViewTextBoxColumn;
	}

	private DataGridViewCheckBoxColumn CreateCheckColumn(UIDataSet.CustomItemRow itemRow)
	{
		DataGridViewCheckBoxColumn dataGridViewCheckBoxColumn = new DataGridViewCheckBoxColumn();
		dataGridViewCheckBoxColumn.HeaderText = itemRow.GridDisplay;
		return dataGridViewCheckBoxColumn;
	}

	private DataGridViewColumn CreateColumn(UIDataSet.CustomItemRow itemRow)
	{
		if (string.IsNullOrEmpty(itemRow.GridDisplay))
		{
			itemRow.GridDisplay = itemRow.Display;
		}
		DataGridViewColumn dataGridViewColumn = null;
		switch (itemRow.Type)
		{
		case 0:
			dataGridViewColumn = CreateTextColumn(itemRow);
			break;
		case 1:
			dataGridViewColumn = CreateNumberColumn(itemRow);
			break;
		case 2:
			dataGridViewColumn = CreateComboColumn(itemRow);
			break;
		case 3:
			dataGridViewColumn = CreateCheckColumn(itemRow);
			break;
		}
		if (dataGridViewColumn != null)
		{
			DataGridViewColumn dataGridViewColumn2 = dataGridViewColumn;
			string name = (dataGridViewColumn.DataPropertyName = itemRow.Field);
			dataGridViewColumn2.Name = name;
			dataGridViewColumn.AutoSizeMode = ((itemRow.Width == 0) ? DataGridViewAutoSizeColumnMode.Fill : DataGridViewAutoSizeColumnMode.NotSet);
			if (itemRow.Width != 0)
			{
				dataGridViewColumn.Width = Math.Abs(itemRow.Width);
			}
		}
		return dataGridViewColumn;
	}

	private void CreateGrid()
	{
		((ISupportInitialize)customDataGridView).BeginInit();
		UIDataSet.CustomItemRow[] customItemRows = _customRow.GetCustomItemRows();
		foreach (UIDataSet.CustomItemRow customItemRow in customItemRows)
		{
			if (customItemRow.Field == "ID" && customItemRow.GridVisible)
			{
				DataGridViewColumn dataGridViewColumn = CreateColumn(customItemRow);
				if (dataGridViewColumn != null)
				{
					dataGridViewColumn.Frozen = true;
					customDataGridView.Columns.Add(dataGridViewColumn);
				}
			}
		}
		UIDataSet.CustomItemRow[] customItemRows2 = _customRow.GetCustomItemRows();
		foreach (UIDataSet.CustomItemRow customItemRow2 in customItemRows2)
		{
			if (customItemRow2.Field != "ID" && customItemRow2.GridVisible)
			{
				DataGridViewColumn dataGridViewColumn2 = CreateColumn(customItemRow2);
				if (dataGridViewColumn2 != null)
				{
					customDataGridView.Columns.Add(dataGridViewColumn2);
				}
			}
		}
		((ISupportInitialize)customDataGridView).EndInit();
	}

	private TextBox CreateTextBox(UIDataSet.CustomItemRow itemRow, out string title, out int rows)
	{
		TextBox textBox = new TextBox();
		title = SplitText(itemRow.Display, out rows);
		if (rows > 0)
		{
			textBox.Multiline = true;
			textBox.Height = rows;
		}
		textBox.DataBindings.Add("Text", customBindingSource, itemRow.Field, formattingEnabled: true, DataSourceUpdateMode.OnPropertyChanged);
		return textBox;
	}

	private NumericUpDown CreateNumericUpdown(UIDataSet.CustomItemRow itemRow, out string title)
	{
		NumericUpDown numericUpDown = new NumericUpDown();
		title = SplitNumber(itemRow.Display, out var place, out var max, out var min);
		numericUpDown.Maximum = max;
		numericUpDown.Minimum = min;
		numericUpDown.DecimalPlaces = place;
		numericUpDown.DataBindings.Add("Value", customBindingSource, itemRow.Field, formattingEnabled: true, DataSourceUpdateMode.OnPropertyChanged);
		return numericUpDown;
	}

	private ComboBox CreateComboBox(UIDataSet.CustomItemRow itemRow, out string title)
	{
		ComboBox comboBox = new ComboBox();
		comboBox.DisplayMember = "Display";
		comboBox.DropDownStyle = ComboBoxStyle.DropDownList;
		comboBox.ValueMember = "Value";
		comboBox.DataSource = SplitCommbo(itemRow.Display, out title);
		comboBox.DataBindings.Add("SelectedValue", customBindingSource, itemRow.Field, formattingEnabled: true, DataSourceUpdateMode.OnPropertyChanged);
		return comboBox;
	}

	private CheckBox CreateCheckBox(UIDataSet.CustomItemRow itemRow, out string title)
	{
		CheckBox checkBox = new CheckBox();
		title = itemRow.Display;
		checkBox.UseVisualStyleBackColor = true;
		checkBox.DataBindings.Add("CheckState", customBindingSource, itemRow.Field, formattingEnabled: true, DataSourceUpdateMode.OnPropertyChanged);
		return checkBox;
	}

	private Label CreateLabel(string text)
	{
		Label label = new Label();
		label.Anchor = AnchorStyles.Left;
		label.AutoSize = true;
		label.Margin = new Padding(5, 5, 5, 5);
		label.Text = text;
		return label;
	}

	private void CreateDetail()
	{
		splitContainer.Panel2.Padding = new Padding(_customRow.Left, _customRow.Top, 0, _customRow.Bottom);
		tableLayoutPanel.ColumnStyles[0].SizeType = SizeType.Absolute;
		tableLayoutPanel.ColumnStyles[0].Width = _customRow.Width1;
		tableLayoutPanel.ColumnStyles[1].SizeType = SizeType.Absolute;
		tableLayoutPanel.ColumnStyles[1].Width = _customRow.Width2;
		if (_customRow.Width3 > 0)
		{
			tableLayoutPanel.ColumnStyles[2].SizeType = SizeType.Absolute;
			tableLayoutPanel.ColumnStyles[2].Width = _customRow.Width3;
		}
		if (_customRow.Width4 > 0)
		{
			tableLayoutPanel.ColumnStyles[3].SizeType = SizeType.Absolute;
			tableLayoutPanel.ColumnStyles[3].Width = _customRow.Width4;
		}
		if (_customRow.Width5 > 0)
		{
			tableLayoutPanel.ColumnStyles[4].SizeType = SizeType.Absolute;
			tableLayoutPanel.ColumnStyles[4].Width = _customRow.Width5;
		}
		if (_customRow.Width6 > 0)
		{
			tableLayoutPanel.ColumnStyles[5].SizeType = SizeType.Absolute;
			tableLayoutPanel.ColumnStyles[5].Width = _customRow.Width6;
		}
		UIDataSet.CustomItemRow[] customItemRows = _customRow.GetCustomItemRows();
		int num = customItemRows.Length;
		int num2 = 0;
		int num3 = 0;
		for (int i = 0; i < num; i++)
		{
			UIDataSet.CustomItemRow customItemRow = customItemRows[i];
			if (!customItemRow.Visible)
			{
				continue;
			}
			if (customItemRow.Type == 5)
			{
				string[] array = customItemRow.Display.Split('|');
				if (array.Length < 4)
				{
					continue;
				}
				string text = "";
				for (int j = 3; j < array.Length; j++)
				{
					if (array[j].Length > 0)
					{
						text = ((text.Length <= 0) ? array[j] : (text + "\r\n" + array[j]));
					}
				}
				Label label = CreateLabel(text);
				splitContainer.Panel2.Controls.Add(label);
				label.Anchor = AnchorStyles.Top | AnchorStyles.Left;
				label.Location = new Point(int.Parse(array[0]), int.Parse(array[1]));
				if (array[2] == "B")
				{
					label.BorderStyle = BorderStyle.FixedSingle;
				}
				label.BringToFront();
			}
			else
			{
				if (customItemRow.Type > 5)
				{
					continue;
				}
				if (i > 0)
				{
					if (customItemRow.Width >= 0)
					{
						tableLayoutPanel.RowStyles.Add(new RowStyle(SizeType.Absolute, 30f));
						num2 = 0;
						num3++;
					}
					else if (num2 >= 5)
					{
						tableLayoutPanel.RowStyles.Add(new RowStyle(SizeType.Absolute, 30f));
						num2 = 0;
						num3++;
					}
				}
				Control control = null;
				string title = string.Empty;
				switch (customItemRow.Type)
				{
				case 0:
				{
					control = CreateTextBox(customItemRow, out title, out var rows);
					if (rows > 1 && tableLayoutPanel.RowStyles[num3].Height < (float)rows)
					{
						tableLayoutPanel.RowStyles[num3].Height = rows;
					}
					break;
				}
				case 1:
					control = CreateNumericUpdown(customItemRow, out title);
					break;
				case 2:
					control = CreateComboBox(customItemRow, out title);
					break;
				case 3:
					control = CreateCheckBox(customItemRow, out title);
					break;
				case 4:
					title = customItemRow.Display;
					break;
				}
				if (title != "#NULL#")
				{
					Label control2 = CreateLabel(title);
					tableLayoutPanel.Controls.Add(control2, num2, num3);
					num2++;
				}
				if (control != null)
				{
					control.Anchor = AnchorStyles.Left;
					control.Width = _customRow.Width2;
					tableLayoutPanel.Controls.Add(control, num2, num3);
					num2++;
				}
			}
		}
	}

	private void Custom_CustomRowChanged()
	{
		if (NoCTRowChanged)
		{
			return;
		}
		try
		{
			UpdateTable();
			DataSet_Changed = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void Custom1_CustomRowChanged(object sender, ECSDataSet.Custom1RowChangeEvent e)
	{
		if (e.Action != DataRowAction.Rollback && e.Action != DataRowAction.Commit)
		{
			if (e.Row.ID < 1)
			{
				e.Row.RejectChanges();
			}
			else
			{
				Custom_CustomRowChanged();
			}
		}
	}

	private void Custom2_CustomRowChanged(object sender, ECSDataSet.Custom2RowChangeEvent e)
	{
		if (e.Action != DataRowAction.Rollback && e.Action != DataRowAction.Commit)
		{
			if (e.Row.ID < 1)
			{
				e.Row.RejectChanges();
			}
			else
			{
				Custom_CustomRowChanged();
			}
		}
	}

	private void Custom3_CustomRowChanged(object sender, ECSDataSet.Custom3RowChangeEvent e)
	{
		if (e.Action != DataRowAction.Rollback && e.Action != DataRowAction.Commit)
		{
			if (e.Row.ID < 1)
			{
				e.Row.RejectChanges();
			}
			else
			{
				Custom_CustomRowChanged();
			}
		}
	}

	private void Custom4_CustomRowChanged(object sender, ECSDataSet.Custom4RowChangeEvent e)
	{
		if (e.Action != DataRowAction.Rollback && e.Action != DataRowAction.Commit)
		{
			if (e.Row.ID < 1)
			{
				e.Row.RejectChanges();
			}
			else
			{
				Custom_CustomRowChanged();
			}
		}
	}

	private void AddRowChanged()
	{
		switch (_customRow._Table)
		{
		case "Custom1":
			ecsDataSet.Custom1.Custom1RowChanged += Custom1_CustomRowChanged;
			break;
		case "Custom2":
			ecsDataSet.Custom2.Custom2RowChanged += Custom2_CustomRowChanged;
			break;
		case "Custom3":
			ecsDataSet.Custom3.Custom3RowChanged += Custom3_CustomRowChanged;
			break;
		case "Custom4":
			ecsDataSet.Custom4.Custom4RowChanged += Custom4_CustomRowChanged;
			break;
		}
	}

	private void RemoveRowChanged()
	{
		switch (_customRow._Table)
		{
		case "Custom1":
			ecsDataSet.Custom1.Custom1RowChanged -= Custom1_CustomRowChanged;
			break;
		case "Custom2":
			ecsDataSet.Custom2.Custom2RowChanged -= Custom2_CustomRowChanged;
			break;
		case "Custom3":
			ecsDataSet.Custom3.Custom3RowChanged -= Custom3_CustomRowChanged;
			break;
		case "Custom4":
			ecsDataSet.Custom4.Custom4RowChanged -= Custom4_CustomRowChanged;
			break;
		}
	}

	private void FillTable()
	{
		switch (_customRow._Table)
		{
		case "Custom1":
			custom1TableAdapter.Fill(ecsDataSet.Custom1);
			break;
		case "Custom2":
			custom2TableAdapter.Fill(ecsDataSet.Custom2);
			break;
		case "Custom3":
			custom3TableAdapter.Fill(ecsDataSet.Custom3);
			break;
		case "Custom4":
			custom4TableAdapter.Fill(ecsDataSet.Custom4);
			break;
		}
	}

	private void UpdateTable()
	{
		switch (_customRow._Table)
		{
		case "Custom1":
			custom1TableAdapter.Update(ecsDataSet.Custom1);
			break;
		case "Custom2":
			custom2TableAdapter.Update(ecsDataSet.Custom2);
			break;
		case "Custom3":
			custom3TableAdapter.Update(ecsDataSet.Custom3);
			break;
		case "Custom4":
			custom4TableAdapter.Update(ecsDataSet.Custom4);
			break;
		}
	}

	private void bindingNavigatorGoto_Click(object sender, EventArgs e)
	{
		if (bindingNavigatorID.Text.Length != 0)
		{
			int num = customBindingSource.Find("ID", bindingNavigatorID.Text);
			if (num != -1)
			{
				customBindingSource.Position = num;
			}
		}
	}

	private void customDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void customBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
	{
		if (e.BindingCompleteContext == BindingCompleteContext.DataSourceUpdate && e.Exception == null)
		{
			e.Binding.BindingManagerBase.EndCurrentEdit();
		}
	}

	private void bindingNavigatorFilter_Click(object sender, EventArgs e)
	{
		if (bindingNavigatorFilter.Checked)
		{
			using (FilterForm filterForm = new FilterForm(customDataGridView))
			{
				if (filterForm.ShowDialog(this) == DialogResult.OK)
				{
					customBindingSource.Filter = filterForm.FilterString;
				}
				else
				{
					bindingNavigatorFilter.Checked = false;
				}
				return;
			}
		}
		customBindingSource.RemoveFilter();
	}

	private void P0_TMSFile_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.ShowDialog_TMSfile_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, _customRow._Table == "Custom1", _customRow._Table == "Custom2", _customRow._Table == "Custom3", _customRow._Table == "Custom4");
	}

	private void P0_Ethernet_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.PopMdiChild_Ethernet_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, _customRow._Table == "Custom1", _customRow._Table == "Custom2", _customRow._Table == "Custom3", _customRow._Table == "Custom4");
		if (Program.mf.m_netForm.mf_Docked)
		{
			base.WindowState = FormWindowState.Normal;
			Close();
		}
	}

	private void DeleteSelect()
	{
		foreach (DataGridViewRow selectedRow in customDataGridView.SelectedRows)
		{
			if (selectedRow.DataBoundItem is DataRowView dataRowView)
			{
				dataRowView.Row.Delete();
			}
		}
		try
		{
			UpdateTable();
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

	private void customDataGridView_KeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode == Keys.Delete)
		{
			e.Handled = true;
			DeleteSelect();
		}
	}

	private void CustomForm_Leave(object sender, EventArgs e)
	{
		customDataGridView.EndEdit();
		customBindingSource.EndEdit();
		if (DataSet_Changed)
		{
			DataSet_Update(_customRow._Table);
			DataSet_Changed = false;
		}
	}

	private DataRow GetCurrentRow()
	{
		if (customBindingSource.Position == -1)
		{
			return null;
		}
		DataRowView dataRowView = (DataRowView)customBindingSource.Current;
		return dataRowView.Row;
	}

	private void cloneToolStripButton_Click(object sender, EventArgs e)
	{
		try
		{
			customDataGridView.EndEdit();
			customBindingSource.EndEdit();
			switch (_customRow._Table)
			{
			case "Custom1":
			{
				ECSDataSet.Custom1Row custom1Row = (ECSDataSet.Custom1Row)GetCurrentRow();
				if (custom1Row != null)
				{
					ECSDataSet.Custom1Row custom1Row2 = ecsDataSet.Custom1.NewCustom1Row();
					object[] itemArray3 = custom1Row.ItemArray;
					itemArray3[0] = custom1Row2.ItemArray[0];
					custom1Row2.ItemArray = itemArray3;
					ecsDataSet.Custom1.AddCustom1Row(custom1Row2);
					int num3 = customBindingSource.Find("ID", itemArray3[0]);
					if (num3 != -1)
					{
						customBindingSource.Position = num3;
					}
				}
				break;
			}
			case "Custom2":
			{
				ECSDataSet.Custom2Row custom2Row = (ECSDataSet.Custom2Row)GetCurrentRow();
				if (custom2Row != null)
				{
					ECSDataSet.Custom2Row custom2Row2 = ecsDataSet.Custom2.NewCustom2Row();
					object[] itemArray2 = custom2Row.ItemArray;
					itemArray2[0] = custom2Row2.ItemArray[0];
					custom2Row2.ItemArray = itemArray2;
					ecsDataSet.Custom2.AddCustom2Row(custom2Row2);
					int num2 = customBindingSource.Find("ID", itemArray2[0]);
					if (num2 != -1)
					{
						customBindingSource.Position = num2;
					}
				}
				break;
			}
			case "Custom3":
			{
				ECSDataSet.Custom3Row custom3Row = (ECSDataSet.Custom3Row)GetCurrentRow();
				if (custom3Row != null)
				{
					ECSDataSet.Custom3Row custom3Row2 = ecsDataSet.Custom3.NewCustom3Row();
					object[] itemArray4 = custom3Row.ItemArray;
					itemArray4[0] = custom3Row2.ItemArray[0];
					custom3Row2.ItemArray = itemArray4;
					ecsDataSet.Custom3.AddCustom3Row(custom3Row2);
					int num4 = customBindingSource.Find("ID", itemArray4[0]);
					if (num4 != -1)
					{
						customBindingSource.Position = num4;
					}
				}
				break;
			}
			case "Custom4":
			{
				ECSDataSet.Custom4Row custom4Row = (ECSDataSet.Custom4Row)GetCurrentRow();
				if (custom4Row != null)
				{
					ECSDataSet.Custom4Row custom4Row2 = ecsDataSet.Custom4.NewCustom4Row();
					object[] itemArray = custom4Row.ItemArray;
					itemArray[0] = custom4Row2.ItemArray[0];
					custom4Row2.ItemArray = itemArray;
					ecsDataSet.Custom4.AddCustom4Row(custom4Row2);
					int num = customBindingSource.Find("ID", itemArray[0]);
					if (num != -1)
					{
						customBindingSource.Position = num;
					}
				}
				break;
			}
			}
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			customBindingSource.CancelEdit();
		}
	}
}
